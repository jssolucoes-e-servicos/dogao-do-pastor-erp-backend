import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { FixRolesModule } from './fix-roles/fix-roles.module';

@Module({
    imports: [HealthModule, FixRolesModule],
})
export class AdminsModule {
    /* void */
}
