// src/common/services/base.service.ts (ou similar)
import { PrismaService } from '@/modules/prisma/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/modules/logger/services/logger.service';

// O tipo de logger que vamos usar nas chamadas finais
type LogMethods = Omit<LoggerService, 'setLog' | 'setWarn' | 'setError'> & {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

@Injectable()
export abstract class BaseService {
  protected readonly _name: string = this.constructor.name;

  protected readonly logger: LogMethods;
  protected readonly prisma: PrismaService;
  protected readonly configs: ConfigService;

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    this.logger = {
      log: (message: string) => loggerService.setLog(this._name, message),
      warn: (message: string) => loggerService.setWarn(this._name, message),
      error: (message: string) => loggerService.setError(this._name, message),
    } as LogMethods;

    this.prisma = prismaService;
    this.configs = configService;
  }
}
