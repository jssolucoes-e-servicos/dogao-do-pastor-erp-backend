import { Module } from '@nestjs/common';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CommandsController } from './controllers/commands.controller';
import { CommandsService } from './services/commands.service';

@Module({
  controllers: [CommandsController],
  providers: [PrismaService, LoggerService, CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {
  /* void */
}
