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
import { Partner } from 'src/generated/client';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
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
      throw new BadRequestException(
        'Este CNPJ já está cadastrado em nossa base.',
      );
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

    await this.sendWelcomeMessage(updatePartner);

    return updatePartner;
  }

  private async sendWelcomeMessage(partner: Partner) {
    const loginUrl = `${this.configService.get('FRONTEND_PORTALS_URL')}/parceiros/acesso`;
    const message =
      `*Bem-vindo ao Dogão do Pastor!* 🌭🙏\n\n` +
      `Olá *${partner.responsibleName}*, sua instituição *${partner.name}* já está ativa no sistema.\n\n` +
      `*Dados de Acesso:*\n` +
      `• CNPJ: ${partner.cnpj}\n` +
      `• Link de Acesso: ${loginUrl}\n\n` +
      `Agora você já pode gerenciar suas doações e parceiros. Estamos felizes em ter você conosco!`;

    try {
      await this.evolutionService.sendText(partner.responsiblePhone, message);
    } catch (error) {
      console.error('Falha ao enviar boas-vindas:', error);
    }
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
    const partner = await super.findOne({ where: { id } });
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
}
