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
      include: {
        userRoles: { include: { role: true } },
        sellers: { select: { id: true, tag: true, cellId: true }, where: { active: true } },
        deliveryPersons: { select: { id: true }, where: { active: true } },
        cells: { select: { id: true }, where: { active: true } },
        cellNetworks: { select: { id: true }, where: { active: true } },
        cellsMember: { select: { id: true, cellId: true, sellerId: true }, where: { active: true } },
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
