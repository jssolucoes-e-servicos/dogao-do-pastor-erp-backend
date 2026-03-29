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
