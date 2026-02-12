import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { LoginDto } from 'src/modules/auth/dto/login.dto';

@Injectable()
export class AuthPartnerService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async login(data: LoginDto) {
    const partner = await this.prisma.partner.findFirst({
      where: {
        OR: [
          { cnpj: data.username.replace(/\D/g, '') },
        ],
        active: true,
        deletedAt: null,
      },
    });

    if (!partner) {
      throw new UnauthorizedException('Credenciais inválidas ou conta inativa.');
    }

    // 2. Valida a senha
    const isPasswordValid = await bcrypt.compare(data.password, partner.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 3. Gera o Payload do JWT
    const payload = {
      sub: partner.id,
      username: partner.cnpj,
      type: 'PARTNER',
      name: partner.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        ...partner,
        type: 'PARTNER',
      },
    };
  }
}
