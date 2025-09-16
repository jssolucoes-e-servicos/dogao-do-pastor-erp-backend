import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) { }
  intercept(
    context: ExecutionContext,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    next: CallHandler<any>,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse();

    const ms = this.reflector.get<number>(
      'request-timeout',
      context.getHandler() || context.getClass(),
    );

    response.setTimeout(ms || 60000);

    return next.handle();
  }
}
