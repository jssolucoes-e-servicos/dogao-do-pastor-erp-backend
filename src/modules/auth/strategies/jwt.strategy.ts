import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService, ConfigService } from 'src/common/helpers/importer.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return req.cookies?.['ddp-ctb-00'] ||
                 req.cookies?.['ddp-prt-00'] ||
                 req.cookies?.['ddp-ctm-00'] ||
                 null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')?.trim() || 'fallback-secret-para-dev',
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub || !payload.type) {
      throw new UnauthorizedException('Token inválido ou incompleto');
    }

    if (payload.type === 'CONTRIBUTOR') {
      const user = await this.prisma.contributor.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: { include: { role: true } },
          sellers: { select: { id: true, tag: true, cellId: true }, where: { active: true } },
          deliveryPersons: { select: { id: true }, where: { active: true } },
          cells: { select: { id: true }, where: { active: true } },
          cellNetworks: { select: { id: true }, where: { active: true } },
          cellsMember: { select: { id: true, cellId: true, sellerId: true }, where: { active: true } },
        },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('Usuário inativo ou não encontrado');
      }

      const roles = user.userRoles.flatMap((ur) => [
        ur.role.name.toUpperCase(),
        ur.roleId,
      ]);

      return {
        id: user.id,
        name: user.name,
        type: 'CONTRIBUTOR',
        roles,
        sellerId: user.sellers[0]?.id || null,
        deliveryPersonId: user.deliveryPersons[0]?.id || null,
        leaderCellId: user.cells[0]?.id || null,
        supervisorNetworkId: user.cellNetworks[0]?.id || null,
      };
    }

    return {
      id: payload.sub,
      type: payload.type,
      roles: [payload.type.toUpperCase()], // Garante que roles seja array para o Guard
    };
  }
}
