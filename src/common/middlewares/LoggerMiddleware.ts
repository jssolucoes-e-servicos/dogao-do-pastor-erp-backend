import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const logger = new Logger('REQUEST');
    logger.log(
      `METHOD: ${req.method}, ORIGIN: ${req.get('origin')} , PATH: ${req.originalUrl}`,
    );
    if (next) {
      next();
    }
  }
}
