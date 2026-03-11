import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new ForbiddenException('Usuário não identificado');

    // Se o usuário for TI (Admin supremo), ele passa em tudo
    if (user.roles?.includes('TI') || user.roles?.includes('ADMIN')) return true;

    // Verifica se alguma das roles do usuário bate com as requeridas na rota
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role.toUpperCase()));
    
    if (!hasRole) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }

    return true;
  }
}