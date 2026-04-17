import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { FixRolesModule } from './fix-roles/fix-roles.module';
import { SeedTicketsModule } from './seed-tickets/seed-tickets.module';
import { BroadcastController } from './notifications/broadcast.controller';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [HealthModule, FixRolesModule, SeedTicketsModule, EvolutionModule],
  controllers: [BroadcastController],
})
export class AdminsModule {}
