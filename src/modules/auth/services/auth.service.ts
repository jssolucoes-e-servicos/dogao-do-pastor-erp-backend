import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserTypesEnum } from 'src/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class AuthService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async changePassword(data: ChangePasswordDto) {
    // Valida se o token (ID do OTP) existe, pertence ao usuário e foi validado
    const validToken = await this.prisma.otpVerification.findFirst({
      where: { id: data.token, userId: data.userId, used: true },
    });

    if (!validToken) {
      throw new UnauthorizedException('Token de validação inválido.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    if (data.type === UserTypesEnum.PARTNER) {
      const user = await this.prisma.partner.findUnique({
        where: { id: data.userId, active: true },
      });
      if (!user) {
        throw new NotFoundException('Parceiro não encontrado');
      }
      await this.prisma.partner.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    } else if (data.type === UserTypesEnum.CUSTOMER) {
      const user = await this.prisma.customer.findUnique({
        where: { id: data.userId },
      });
      if (!user) {
        throw new NotFoundException('Cliente não encontrado');
      }
      await this.prisma.customer.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    } else if (data.type === UserTypesEnum.CONTRIBUTOR) {
      const user = await this.prisma.contributor.findUnique({
        where: { id: data.userId, active: true },
      });
      if (!user) {
        throw new NotFoundException('Colaborador não encontrado');
      }
      console.log(user);
      await this.prisma.contributor.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    } else {
      throw new NotFoundException('Tipo de usuário inválido.');
    }

    await this.prisma.otpVerification.delete({ where: { id: validToken.id } });

    return { success: true };
  }
}
