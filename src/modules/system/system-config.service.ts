import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    return value === 'true';
  }

  async set(key: string, value: string, updatedBy?: string): Promise<void> {
    await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, updatedBy, updatedAt: new Date() },
      create: { key, value, updatedBy },
    });
  }
}
