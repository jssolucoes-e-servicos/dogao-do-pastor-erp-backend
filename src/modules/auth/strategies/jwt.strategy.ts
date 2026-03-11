import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/common/helpers/importer.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: (req: Request) => {
        // Garanta que retorne null se não houver o cookie para não quebrar o passport
        const token = req.cookies?.['ddp-ctb-00'] || req.cookies?.['ddp-prt-00'] || null;
        return token;
      },
      ignoreExpiration: false,
      // Use "!" para afirmar ao TS que a variável existe ou use um fallback
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-para-dev', 
    });
  }

  async validate(payload: any) {
    // 1. Validação básica de existência do payload
    if (!payload || !payload.sub || !payload.type) {
      throw new UnauthorizedException('Token inválido ou incompleto');
    }

    // 2. Se for CONTRIBUTOR (ERP), injetamos os perfis vinculados para facilitar o uso no Controller
    if (payload.type === 'CONTRIBUTOR') {
      const user = await this.prisma.contributor.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: { include: { role: true } },
          sellers: { select: { id: true }, where: { active: true } },
          deliveryPersons: { select: { id: true }, where: { active: true } },
          cells: { select: { id: true }, where: { active: true } },
          cellNetworks: { select: { id: true }, where: { active: true } },
        }
      });

      if (!user || !user.active) throw new UnauthorizedException('Usuário inativo ou não encontrado');

      return {
        id: user.id,
        name: user.name,
        type: 'CONTRIBUTOR',
        // Mapeamos as roles para um array simples de strings para o Guard
        roles: user.userRoles.map(ur => ur.role.name.toUpperCase()),
        // IDs vinculados para lógica de negócio
        sellerId: user.sellers[0]?.id || null,
        deliveryPersonId: user.deliveryPersons[0]?.id || null,
        leaderCellId: user.cells[0]?.id || null,
        supervisorNetworkId: user.cellNetworks[0]?.id || null,
      };
    }

    // 3. Lógica simplificada para PARTNER e CUSTOMER (vínculos fixos 1:1)
    return {
      id: payload.sub,
      type: payload.type,
      role: payload.type, // O tipo vira a role principal
    };
  }
}
