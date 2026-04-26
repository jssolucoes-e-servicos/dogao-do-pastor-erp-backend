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
    this.logger.log(`Tentativa de login para usuário: ${data.username}`);

    const contributor = await this.prisma.contributor.findFirst({
      where: {
        username: { equals: data.username, mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        userRoles: { include: { role: true } },
        sellers: {
          select: {
            id: true,
            tag: true,
            cellId: true,
          },
          where: { active: true },
        },
        deliveryPersons: { select: { id: true }, where: { active: true } },
        cells: { select: { id: true }, where: { active: true } },
        cellNetworks: { select: { id: true }, where: { active: true } },
        cellsMember: {
          select: {
            id: true,
            cellId: true,
            cell: {
              select: {
                id: true,
                name: true,
                sellerId: true,
                seller: { select: { id: true, name: true, tag: true } },
              },
            },
          },
          where: { active: true },
        },
      },
    });

    if (!contributor) {
      this.logger.warn(`Usuário não encontrado: ${data.username}`);
      throw new UnauthorizedException(
        'Credenciais inválidas ou conta inativa.',
      );
    }

    if (!contributor.active) {
      this.logger.warn(`Usuário encontrado mas está inativo: ${data.username}`);
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
      this.logger.warn(`Senha incorreta para usuário: ${data.username}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    this.logger.log(
      `Login bem-sucedido: ${data.username} (ID: ${contributor.id})`,
    );

    const roles = contributor.userRoles.flatMap((ur) => [
      ur.role.name.toUpperCase(),
      ur.roleId,
    ]);

    // 3. Gera o Payload do JWT
    const payload = {
      sub: contributor.id,
      username: contributor.username,
      type: 'CONTRIBUTOR',
      name: contributor.name,
      roles, // Inclui roles no JWT para o Guard
    };

    const { password, ...userWithoutPassword } = contributor;

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        ...userWithoutPassword,
        type: 'CONTRIBUTOR',
        roles,
      },
    };
  }
}
