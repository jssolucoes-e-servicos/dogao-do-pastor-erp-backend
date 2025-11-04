import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (user && user.active) {
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        // Remover campos sensíveis no retorno
        const { password, ...result } = user;
        return result;
      }
    }
    throw new UnauthorizedException('Username ou senha inválido');
  }
}
