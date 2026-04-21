import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { UploadsService } from '../uploads/services/uploads.service';
import { UploadsModule } from '../uploads/uploads.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { EvolutionModule } from '../evolution/evolution.module';
import { ContributorsNotificationsService } from '../evolution/services/notifications/contributors-notifications.service';
import { ContributorsController } from './controllers/contributors.controller';
import { ContributorsService } from './services/contributors.service';

@Module({
  imports: [UploadsModule, EvolutionModule, PermissionsModule],
  controllers: [ContributorsController],
  providers: [
    PrismaService,
    LoggerService,
    ContributorsService,
    UploadsService,
    ContributorsNotificationsService,
  ],
  exports: [ContributorsService],
})
export class ContributorsModule {
  /* void */
}
