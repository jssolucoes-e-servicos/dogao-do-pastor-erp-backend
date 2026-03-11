import { Module } from '@nestjs/common';
import { LoggerService, PrismaService } from 'src/common/helpers/importer.helper';
import { N8nService } from './services/n8n.service';

@Module({
  providers: [
    PrismaService,
    LoggerService,
    N8nService,
  ],
  exports: [N8nService],
})
export class N8nModule {
  /* void */
}
