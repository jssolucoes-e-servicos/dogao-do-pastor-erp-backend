import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { MemoryStoredFile } from 'nestjs-form-data';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ContributorEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateContributorDto } from 'src/modules/contributors/dto/create-contributor.dto';
import { UpdateContributorDto } from 'src/modules/contributors/dto/update-contributor.dto';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
import { ContributorsNotificationsService } from 'src/modules/evolution/services/notifications/contributors-notifications.service';

@Injectable()
export class ContributorsService extends BaseCrudService<
  ContributorEntity,
  CreateContributorDto,
  UpdateContributorDto,
  PrismaBase.ContributorDelegate
> {
  protected model: PrismaBase.ContributorDelegate;

  /**
   * Nunca retornar senha
   */
  protected defaultSelect = {
    password: false,
  };

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly contributorsNotifications: ContributorsNotificationsService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.contributor;
  }

  /* ======================================================
   * Regras de negócio
   * ====================================================== */

  private async validateCreate(dto: CreateContributorDto): Promise<void> {
    const or: PrismaBase.ContributorWhereInput[] = [];

    if (dto.name) {
      or.push({ name: dto.name });
    }

    if (dto.username) {
      or.push({ username: dto.username });
    }

    if (dto.phone) {
      or.push({ phone: dto.phone });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.name === dto.name) {
      throw new ConflictException(
        `Já existe um colaborador cadastrado com o nome "${dto.name}"`,
      );
    }

    if (dto.username && exists.username === dto.username) {
      throw new ConflictException(
        `Já existe um colaborador cadastrado com o username "${dto.username}"`,
      );
    }

    if (dto.phone && exists.phone === dto.phone) {
      throw new ConflictException(
        `Já existe um colaborador cadastrado com o telefone "${dto.phone}"`,
      );
    }
  }

  /* ======================================================
   * CRUD
   * ====================================================== */

  async create(dto: CreateContributorDto): Promise<ContributorEntity> {
    await this.validateCreate(dto);

    const password = await bcrypt.hash('dogao@2026', 10);

    return this.model.create({
      data: {
        ...dto,
        password,
      },
    }) as unknown as ContributorEntity;
  }

  /** Vincula contributor a uma célula como membro */
  async addToCell(contributorId: string, cellId: string): Promise<void> {
    const cell = await this.prisma.cell.findUnique({
      where: { id: cellId },
      select: { id: true, name: true, leaderId: true, sellerId: true },
    });
    if (!cell) throw new NotFoundException('Célula não encontrada');

    // Se o contributor for o líder da célula, garantimos que ele tenha um Seller e que a Cell aponte para ele
    if (cell.leaderId === contributorId) {
      let leaderSeller = await this.prisma.seller.findFirst({
        where: { contributorId, cellId, active: true },
        select: { id: true },
      });

      // Se o líder não tem vendedor nessa célula, criamos um
      if (!leaderSeller) {
        const contributor = await this.prisma.contributor.findUnique({
          where: { id: contributorId },
          select: { name: true, username: true },
        });
        const tag = (contributor?.username ?? contributorId.slice(-6)).toLowerCase().replace(/\s/g, '');
        
        leaderSeller = await this.prisma.seller.create({
          data: {
            name: contributor?.name ?? 'Líder',
            cellId,
            contributorId,
            tag,
          },
        });
      }

      // Se a célula ainda não tem esse vendedor como default, atualizamos
      if (cell.sellerId !== leaderSeller.id) {
        await this.prisma.cell.update({
          where: { id: cellId },
          data: { sellerId: leaderSeller.id },
        });
      }
    }

    // Cria/Atualiza vínculo ContributorCell (apenas membresia)
    const existing = await this.prisma.contributorCell.findFirst({
      where: { contributorId }, // Agora é único por pessoa
    });

    if (!existing) {
      await this.prisma.contributorCell.create({
        data: { contributorId, cellId },
      });
    } else {
      await this.prisma.contributorCell.update({
        where: { id: existing.id },
        data: { cellId, active: true, deletedAt: null },
      });
    }

    // Atribui role Vendedor se não tiver (usa upsert para evitar erro de unique constraint)
    const vendedorRole = await this.prisma.role.findFirst({
      where: { name: { contains: 'Vendedor', mode: 'insensitive' }, active: true },
    });
    if (vendedorRole) {
      await this.prisma.userRole.upsert({
        where: {
          contributorId_roleId: {
            contributorId,
            roleId: vendedorRole.id,
          },
        },
        update: { active: true, deletedAt: null },
        create: {
          contributorId,
          roleId: vendedorRole.id,
        },
      });
    }

    // Envia mensagem de boas-vindas com credenciais (em background)
    this.contributorsNotifications.sendWelcomeCredentialsOne(contributorId).catch(() => {});
  }

  async list(
    query: PaginationQueryDto,
    user?: any,
  ): Promise<IPaginatedResponse<ContributorEntity>> {
    const { search } = query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            {
              cells: {
                some: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
            {
              cellNetworks: {
                some: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {};

    return this.paginate(query, {
      where,
      include: {
        cells: true,
        cellNetworks: true,
        deliveryPersons: true,
        sellers: true,
        cellsMember: { 
          where: { active: true },
          include: { cell: { include: { seller: true } } }
        },
        userRoles: { include: { role: true } },
        permissions: { include: { module: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<ContributorEntity> {
    return super.findById(id, {
      include: {
        cells: true,
        cellNetworks: true,
        deliveryPersons: true,
        sellers: true,
        cellsMember: { 
          where: { active: true },
          include: { cell: { include: { seller: true } } }
        },
        userRoles: { include: { role: true } },
        permissions: { include: { module: true } },
      },
    });
  }

  async findByUsername(username: string): Promise<ContributorEntity> {
    const contributor = await super.findOne(
      {
        username: username,
      },
      {
        include: {
          cells: true,
          cellNetworks: true,
          deliveryPersons: true,
          sellers: true,
          cellsMember: { 
            where: { active: true },
            include: { cell: { include: { seller: true } } }
          },
          userRoles: { include: { role: true } },
          permissions: { include: { module: true } },
        },
      },
    );
    return contributor;
  }

  async findForLogin(username: string) {
    const contributor = await this.model.findFirst({
      where: {
        username: username,
      },
      include: {
        sellers: true,
        cells: true,
        cellNetworks: true,
        deliveryPersons: true,
        cellsMember: { 
          where: { active: true },
          include: { cell: { include: { seller: true } } }
        },
        userRoles: { include: { role: true } },
        permissions: { include: { module: true } },
      },
    });
    return contributor;
  }

  async update(
    id: string,
    dto: UpdateContributorDto,
  ): Promise<ContributorEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<ContributorEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<ContributorEntity> {
    return super.restoreData({ id });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const contributor = await this.model.findUnique({ where: { id } });
    if (!contributor) throw new NotFoundException('Colaborador não encontrado');

    const valid = await bcrypt.compare(currentPassword, contributor.password);
    if (!valid) throw new ConflictException('Senha atual incorreta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.model.update({ where: { id }, data: { password: hashed } });
    return { message: 'Senha alterada com sucesso' };
  }
  async uploadPhoto(id: string, file: MemoryStoredFile) {
    const contributor = await this.model.findUnique({
      where: { id: id },
    });
    if (!contributor) throw new NotFoundException('Colaborador não encontrado');
    const [uploadResult] = await this.uploadsService.uploadFiles(
      [file],
      'contributors',
      id,
    );
    const updated = await this.model.update({
      where: { id: id },
      data: { photo: uploadResult.url },
    });

    return {
      logo: updated.photo,
      message: 'Foto atualizada com sucesso',
    };
  }

  /* ======================================================
   * Roles & Permissions
   * ====================================================== */

  async linkRole(contributorId: string, roleId: string) {
    return this.prisma.userRole.upsert({
      where: {
        contributorId_roleId: {
          contributorId,
          roleId,
        },
      },
      update: { active: true, deletedAt: null },
      create: {
        contributorId,
        roleId,
      },
    });
  }

  async unlinkRole(contributorId: string, roleId: string) {
    return this.prisma.userRole.update({
      where: {
        contributorId_roleId: {
          contributorId,
          roleId,
        },
      },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  }

  async setIndividualPermission(
    contributorId: string,
    moduleId: string,
    permissions: {
      access?: boolean;
      create?: boolean;
      update?: boolean;
      delete?: boolean;
      report?: boolean;
    },
  ) {
    return this.prisma.permission.upsert({
      where: {
        id:
          (
            await this.prisma.permission.findFirst({
              where: { contributorId, moduleId },
            })
          )?.id || 'new-id',
      },
      update: { ...permissions },
      create: {
        contributorId,
        moduleId,
        ...permissions,
      },
    });
  }
}
