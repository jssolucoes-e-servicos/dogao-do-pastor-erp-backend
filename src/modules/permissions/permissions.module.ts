import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { PermissionsController } from './controllers/permissions.controller';
import { PermissionsService } from './services/permissions.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { PermissionResolverService } from './services/permission-resolver.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [PermissionsController],
  providers: [
    PrismaService,
    PermissionsService,
    PermissionCacheService,
    PermissionResolverService,
  ],
  exports: [PermissionsService, PermissionCacheService, PermissionResolverService],
})
export class PermissionsModule {}
