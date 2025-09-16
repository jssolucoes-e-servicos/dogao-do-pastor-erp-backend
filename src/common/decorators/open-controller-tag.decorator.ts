import { Controller, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

export function OpenControllerTag(tag: string, route: string) {
  return applyDecorators(Controller(route), ApiTags(tag));
}
