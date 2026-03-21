import { Module } from '@nestjs/common';
import { SeedTicketsController } from './seed-tickets.controller';

@Module({
  controllers: [SeedTicketsController],
})
export class SeedTicketsModule {}
