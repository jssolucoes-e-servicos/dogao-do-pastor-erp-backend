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
      await this.prisma.partner.update({ where: { id: data.userId }, data: { password: hashedPassword } });
    } else if (data.type === UserTypesEnum.CUSTOMER) {
      await this.prisma.customer.update({ where: { id: data.userId }, data: { password: hashedPassword } });
    } else if (data.type === UserTypesEnum.CONTRIBUTOR) {
      await this.prisma.partner.update({ where: { id: data.userId }, data: { password: hashedPassword } });
    } else {
      throw new NotFoundException('Tipo de usuário inválido.');
    }

    await this.prisma.otpVerification.delete({ where: { id: data.token } });

    return { success: true };
  }
}
