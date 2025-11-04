// Assumindo que este serviço existe
// src/modules/user/services/user.service.ts

// ... imports e BaseService ...
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { Injectable } from '@nestjs/common';
// ... outros imports

@Injectable()
export class UserService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: {
        username: username,
        active: true, // Garante que o usuário está ativo
        deletedAt: null, // Garante que não foi soft-deletado
      },
    });
  }
}
