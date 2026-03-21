import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { FixRolesModule } from './fix-roles/fix-roles.module';
import { SeedTicketsModule } from './seed-tickets/seed-tickets.module';

@Module({
    imports: [HealthModule, FixRolesModule, SeedTicketsModule],
})
export class AdminsModule {
    /* void */
}
