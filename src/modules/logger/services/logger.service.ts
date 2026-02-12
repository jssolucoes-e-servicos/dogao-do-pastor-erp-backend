// src/modules/logger/services/logger.service.ts
import { Logger } from '@nestjs/common';

export class LoggerService {
  setLog(origin: string, message: string) {
    const logger = new Logger(origin);
    logger.log(message);
  }

  setWarn(origin: string, message: string) {
    const logger = new Logger(origin);
    logger.warn(message);
  }

  setError(origin: string, message: string) {
    const logger = new Logger(origin);
    logger.error(message);
  }
}
