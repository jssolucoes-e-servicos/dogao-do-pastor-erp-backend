import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { SystemConfigService } from './system-config.service';

@Module({
  providers: [PrismaService, SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemModule {}
