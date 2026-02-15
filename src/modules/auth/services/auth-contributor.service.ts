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
export class AuthContributorService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async login(data: LoginDto) {
    const contributor = await this.prisma.contributor.findFirst({
      where: {
        username: data.username,
        active: true,
        deletedAt: null,
      },
    });

    if (!contributor) {
      throw new UnauthorizedException(
        'Credenciais inválidas ou conta inativa.',
      );
    }

    // 2. Valida a senha
    const isPasswordValid = await bcrypt.compare(
      data.password,
      contributor.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 3. Gera o Payload do JWT
    const payload = {
      sub: contributor.id,
      username: contributor.username,
      type: 'CONTRIBUTOR',
      name: contributor.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        ...contributor,
        type: 'CONTRIBUTOR',
      },
    };
  }
}
