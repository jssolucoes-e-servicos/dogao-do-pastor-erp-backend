// src/common/decorators/open-controller-tag.decorator.ts
import { Controller, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Decorator que combina a rota base 'admin' com a tag do Swagger formatada.
 * @param route - O sufixo da rota (ex: 'health-check' vira 'Admin - Health Check').
 * @returns Um decorator composto que aplica o Controller e a Tag do Swagger.
 */
export function AdminController(route: string) {
  const formattedTag = route
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const tagName = `Admin - ${formattedTag}`;

  return applyDecorators(Controller(`admin/${route}`), ApiTags(tagName));
}
