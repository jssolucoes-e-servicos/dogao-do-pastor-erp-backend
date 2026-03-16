import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AccessLinkGuard implements CanActivate {
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
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Admins e TI passam direto
    if (user.roles?.includes('IT') || user.roles?.includes('ADMIN')) {
      return true;
    }

    // Se a rota for GET e listagem, a filtragem será feita no serviço via query params ou user context
    // Este guard foca em validar se o ID de um recurso específico pertence ao usuário
    
    return true; // Por enquanto permitimos e vamos refinar nos serviços
  }
}
