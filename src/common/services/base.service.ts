// src/common/services/base.service.ts (ou similar)
import { PrismaService } from '@/modules/prisma/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { LogMethodsType } from '../types/log-methods.type';

@Injectable()
export abstract class BaseService {
  protected readonly _name: string = this.constructor.name;

  protected readonly logger: LogMethodsType;
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
    } as LogMethodsType;

    this.prisma = prismaService;
    this.configs = configService;
  }
}
