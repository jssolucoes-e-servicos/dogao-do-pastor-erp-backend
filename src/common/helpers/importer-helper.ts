import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/common/services/base.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { BaseController } from '../controllers/base.controller';

//exports
export {
  BaseController, BaseService, ConfigService,
  LoggerService,
  PrismaService
};

