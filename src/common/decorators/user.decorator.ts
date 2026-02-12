// src/common/decorators/user.decorator.ts
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * User decorator
 * @param {string} data - Dados
 * @param {ExecutionContext} ctx - Contexto
 * @returns {type} retorna um decorator com dados do usuario logado
 */
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
