import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { SystemConfigService } from './system-config.service';
import { GeocodingService } from './services/geocoding.service';
import { SetupService } from './services/setup.service';

import { SystemController } from './controllers/system.controller';

@Module({
  controllers: [SystemController],
  providers: [PrismaService, SystemConfigService, GeocodingService, SetupService],
  exports: [SystemConfigService, GeocodingService],
})
export class SystemModule {}
