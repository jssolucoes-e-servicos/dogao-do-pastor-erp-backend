import { Injectable, Inject } from '@nestjs/common';
import type { LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  log(message: any, context?: string) {
    this.logger.log(message, context);
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, stack, context);
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string) {
    // Adicionado o ?. para chamada segura
    this.logger.debug?.(message, context);
  }

  verbose(message: any, context?: string) {
    // Adicionado o ?. para chamada segura
    this.logger.verbose?.(message, context);
  }

  // Métodos de compatibilidade com a versão anterior do LoggerService
  setLog(origin: string, message: string) {
    this.log(message, origin);
  }

  setWarn(origin: string, message: string) {
    this.warn(message, origin);
  }

  setError(origin: string, message: string) {
    this.error(message, undefined, origin);
  }
}
