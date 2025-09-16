import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { TimeoutInterceptor } from 'src/common/interceptors/timeout.interceptor';

const setTimeout = (ms: number) => SetMetadata('request-timeout', ms);

export function Timeout(ms = 60000) {
  return applyDecorators(setTimeout(ms), UseInterceptors(TimeoutInterceptor));
}
