// src/common/services/base.service.ts (ou similar)
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { LogMethodsType } from 'src/common/types/log-methods.type';

@Injectable()
export abstract class BaseService {
  protected readonly _name: string = this.constructor.name;

  protected readonly logger: LogMethodsType;
  protected readonly prisma: PrismaService;
  protected readonly configs: ConfigService;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
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
