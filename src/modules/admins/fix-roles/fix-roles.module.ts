import { Module } from '@nestjs/common';
import { FixRolesController } from './fix-roles.controller';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Module({
  controllers: [FixRolesController],
  providers: [PrismaService],
})
export class FixRolesModule {}
