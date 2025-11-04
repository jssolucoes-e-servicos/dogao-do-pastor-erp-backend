// src/modules/email/controllers/email-test.controller.ts

import { ConfigService } from '@nestjs/config';
import { IConfig } from 'src/common/interfaces';
import { LogMethodsType } from 'src/common/types/log-methods.type';
import { LoggerService } from '../helpers/importer-helper';

export abstract class BaseController {
  protected readonly _name: string = this.constructor.name;
  protected readonly configs: ConfigService<IConfig>;
  protected readonly logger: LogMethodsType;

  constructor(loggerService: LoggerService, configService: ConfigService) {
    this.logger = {
      log: (message: string) => loggerService.setLog(this._name, message),
      warn: (message: string) => loggerService.setWarn(this._name, message),
      error: (message: string) => loggerService.setError(this._name, message),
    } as LogMethodsType;

    this.configs = configService as unknown as ConfigService<IConfig>;
  }
}
