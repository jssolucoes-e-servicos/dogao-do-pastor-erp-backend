import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Bypass especial para manutenção T.I via Secret Header
    const systemSecret = request.headers['x-system-secret'];
    if (systemSecret === 'dogao-master-key-2026') return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = request;

    if (!user) throw new ForbiddenException('Usuário não identificado');

    // Se o usuário for IT, TI ou ADMIN ele passa em tudo que requer role (Superusuários)
    const userRoles = user.roles || [];
    const isMaster = userRoles.some((r: string) => ['IT', 'TI', 'ADMIN', 'ADMINISTRAÇÃO', 'ADMINISTRACAO'].includes(r.toUpperCase()));
    if (isMaster) return true;

    // Normaliza roles requeridas para comparação (tudo maiúsculo)
    const normalizedRequired = requiredRoles.map(r => r.toUpperCase());

    // Verifica se alguma das roles do usuário bate com as requeridas na rota
    const hasRole = normalizedRequired.some((role) => userRoles.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException(`Acesso negado. Requer prefil: ${normalizedRequired.join(', ')}`);
    }

    return true;
  }
}