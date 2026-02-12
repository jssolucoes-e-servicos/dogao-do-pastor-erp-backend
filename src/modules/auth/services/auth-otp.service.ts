import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTypesEnum } from 'src/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { OtpRequestDto } from '../dto/otp-request.dto';
import { OtpValidateDto } from '../dto/otp-validate.dto';

@Injectable()
export class AuthOtpService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async requestOtp(data: OtpRequestDto): Promise<boolean> {
    let phoneNumber: string | null = null;
    let userExists = false;

    // 1. Busca e extração do telefone por tipo
    if (data.type === UserTypesEnum.PARTNER) {
      const partner = await this.prisma.partner.findUnique({
        where: { id: data.userId },
      });
      if (partner) {
        userExists = true;
        phoneNumber = partner.responsiblePhone;
      }
    } else if (data.type === UserTypesEnum.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: data.userId },
      });
      if (customer) {
        userExists = true;
        phoneNumber = customer.phone;
      }
    } else if (data.type === UserTypesEnum.CONTRIBUTOR) {
      const contributor = await this.prisma.contributor.findUnique({
        where: { id: data.userId },
      });
      if (contributor) {
        userExists = true;
        phoneNumber = contributor.phone;
      }
    } else {
      throw new NotFoundException('Tipo de usuário inválido.');
    }

    if (!userExists || !phoneNumber) {
      throw new NotFoundException(
        'Usuário não encontrado ou telefone de contato não cadastrado.',
      );
    }

    // 2. Lógica de Resiliência: Verifica se já existe um OTP válido gerado recentemente (ex: nos últimos 3 min)
    // Se o usuário fechar o modal e abrir de novo, ele recebe o mesmo código se ainda estiver no prazo.
    const now = new Date();
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60000);

    const existingOtp = await this.prisma.otpVerification.findFirst({
      where: {
        userId: data.userId,
        userType: data.type,
        used: false,
        expiresAt: { gt: now },
        createdAt: { gt: threeMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      // Re-envia o mesmo código para evitar gerar múltiplos tokens no banco
      const message = `Seu código de segurança *Dogão do Pastor* (reenviado) é: *${existingOtp.code}*\n\nEste código expira em breve.`;
      await this.evolutionService.sendText(phoneNumber, message);
      return true;
    }

    // 3. Geração de novo OTP caso não exista um recente
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.otpVerification.create({
      data: {
        userId: data.userId,
        userType: data.type,
        code: otpCode,
        phone: phoneNumber,
        expiresAt,
      },
    });

    const message = `Seu código de segurança *Dogão do Pastor* é: *${otpCode}*\n\nEste código expira em 10 minutos.`;
    await this.evolutionService.sendText(phoneNumber, message);
    return true;
  }

  async validateOtp(data: OtpValidateDto) {
    const otpEntry = await this.prisma.otpVerification.findFirst({
      where: {
        userId: data.userId,
        code: data.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpEntry) {
      return { otpValid: false, token: null };
    }

    // Marcamos como usado para que o token retornado (ID) seja a prova de validação para o reset de senha
    await this.prisma.otpVerification.update({
      where: { id: otpEntry.id },
      data: { used: true },
    });

    return { otpValid: true, token: otpEntry.id };
  }
}
