// src/ common/decorators/timeout.decorator.ts
import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { TimeoutInterceptor } from 'src/common/interceptors/timeout.interceptor';

const setTimeout = (ms: number) => SetMetadata('request-timeout', ms);


/**
 * Timeout decorator
 * @param {number} ms - tempo de timeout em milisegundos
 * @returns {decorator} Retorna um decorator que altera o timeout da rota/função
 */
export function Timeout(ms = 60000) {
  return applyDecorators(setTimeout(ms), UseInterceptors(TimeoutInterceptor));
}
