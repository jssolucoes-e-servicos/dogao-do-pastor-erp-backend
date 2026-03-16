import { Module } from '@nestjs/common';
import { SetupService } from './services/setup.service';
import { SystemController } from './controllers/system.controller';

@Module({
  providers: [SetupService],
  controllers: [SystemController],
  exports: [SetupService],
})
export class SystemModule {}
