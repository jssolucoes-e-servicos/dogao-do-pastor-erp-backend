import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { MemoryStoredFile } from 'nestjs-form-data';
import { PartnerEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { PartnersNotificationsService } from 'src/modules/evolution/services/notifications/partners-notifications.service';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
import { inviteSendWhatsappDTO } from '../dto/invite-sendwhatsapp.dto';
import { RegisterPartnerDto } from '../dto/register-partner.dto';
import { UpdatePartnerDto } from '../dto/update-partner.dto';

@Injectable()
export class PartnersService extends BaseCrudService<
  PartnerEntity,
  RegisterPartnerDto,
  UpdatePartnerDto,
  PrismaBase.PartnerDelegate
> {
  protected model: PrismaBase.PartnerDelegate;
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
    private readonly partnersNotificationsService: PartnersNotificationsService,
    private readonly uploadsService: UploadsService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.partner;
  }

  async register(id: string, data: RegisterPartnerDto) {
    // 1. Validar se o WhatsApp do responsável existe
    const waCheck = await this.evolutionService.checkWhatsAppNumber(
      data.responsiblePhone,
    );
    if (!waCheck[0]?.exists) {
      throw new BadRequestException(
        'O número de WhatsApp informado não é válido.',
      );
    }
    const existing = await this.model.findFirst({
      where: { cnpj: data.cnpj, NOT: { id } },
    });

    if (existing) {
      if (existing.cnpj !== data.cnpj) {
        throw new BadRequestException(
          'Este CNPJ já está cadastrado em nossa base.',
        );
      }
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const updatePartner = await this.model.update({
      where: { id },
      data: {
        ...data,
        password: hashedPassword,
        approved: true,
        active: true,
      },
    });
    await this.partnersNotificationsService.welcomePortal(updatePartner);
    return updatePartner;
  }

  async verifyLink(id: string): Promise<{ valid: boolean; message: string }> {
    const partner = await this.model.findUnique({ where: { id } });

    if (!partner) {
      return {
        valid: false,
        message: 'Link inválido',
      };
    }

    if (partner.approved === true || partner.active === true) {
      return {
        valid: false,
        message: 'Este link já foi utilizado',
      };
    }
    return {
      valid: true,
      message: 'Válido',
    };
  }

  async findOne(id: string): Promise<PartnerEntity> {
    const partner = await super.findOne({ id, deletedAt: null });

    if (!partner) {
      throw new NotFoundException(`Parceiro com ID ${id} não encontrado`);
    }

    return partner;
  }

  async update(id: string, data: UpdatePartnerDto): Promise<PartnerEntity> {
    const partner = await super.findOne({ id });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    try {
      return await super.update(id, data);
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar dados do parceiro.');
    }
  }

  /**
   * Realiza o upload da logo e atualiza o registro do parceiro
   */
  async updateLogo(partnerId: string, file: MemoryStoredFile) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    const [uploadResult] = await this.uploadsService.uploadFiles([file]);
    const updatedPartner = await this.prisma.partner.update({
      where: { id: partnerId },
      data: { logo: uploadResult.url },
    });

    return {
      logo: updatedPartner.logo,
      message: 'Logo atualizada com sucesso',
    };
  }

  async listForOrders(): Promise<PartnerEntity[]> {
    const partners = await this.model.findMany({
      where: {
        approved: true,
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return partners;
  }

  async listAll(): Promise<PartnerEntity[]> {
    const partners = await this.model.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return partners;
  }

  async inviteGenerate(): Promise<PartnerEntity> {
    const password = await bcrypt.hash('dogao@2026', 10);
    const countPartners = await this.model.count();
    const sequence = countPartners + 1;
    // Gera um CNPJ fake único com 14 dígitos (ex: 00000000000001, 00000000000002...)
    const cnpj = sequence.toString().padStart(14, '0');
    // Gera um Telefone fake único com 11 dígitos iniciando em 51 (ex: 51000000001, 51000000002...)
    const phone = `51${sequence.toString().padStart(9, '0')}`;

    const forRegister = {
      name: `Parceiro temporário ${sequence}`,
      cnpj,
      phone,
      description: 'Descrição da entidade parceira (Aguardando preenchimento)',
      website: '',
      facebook: '',
      instagram: '',
      addressInLine: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      complement: '',
      responsibleName: '',
      responsiblePhone: '',
      approved: false,
      password,
      active: false,
    };
    const partner = await super.create(forRegister);
    return partner;
  }

  async inviteSendWhatsapp(dto: inviteSendWhatsappDTO): Promise<boolean> {
    const partner = await this.model.findUnique({
      where: {
        id: dto.inviteId,
      },
    });
    if (!partner) {
      throw new NotFoundException('Não foi encontrado convite com este id');
    }
    await this.partnersNotificationsService.sendInvite(
      partner,
      dto.destination,
    );
    return true;
  }
}
