import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/client';
import { softDeleteExtension } from '../extensions/soft-delete.extension';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      }),
    });
    return this.$extends(softDeleteExtension) as this;
  }
}
