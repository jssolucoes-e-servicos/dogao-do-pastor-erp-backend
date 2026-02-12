import { ConfigService } from '@nestjs/config';
import { AdminController } from 'src/common/decorators/admin-controller.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { BaseService } from 'src/common/services/base.service';
import { BaseCrudService } from 'src/common/services/crud-base.service';
import { Prisma as PrismaBase } from 'src/generated/client';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

export {
  AdminController, BaseCrudService,
  BaseService,
  ConfigService,
  LoggerService,
  PaginationQueryDto, PrismaBase, PrismaService
};

