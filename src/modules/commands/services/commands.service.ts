import { DeliveryOptionEnum } from '@/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { OrderOnlineService } from '@/modules/order-online/services/order-online.service';
import { Injectable } from '@nestjs/common';
import { Command } from '@prisma/client';

@Injectable()
export class CommandsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly orderOnlineService: OrderOnlineService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async generateAllCommands(editionCode: number) {
    const created: Command[] = [];
    const orders = await this.orderOnlineService.findAllOrdersForReport();
    for (const order of orders) {
      // Garante que não repetirá comanda para pedidos já vinculados
      const exists = await this.prisma.command.findFirst({
        where: { orderOnlineId: order.id },
      });
      if (!exists) {
        const sequentialId = await this.generateSequentialId(editionCode);
        const command = await this.prisma.command.create({
          data: {
            sequentialId,
            orderOnlineId: order.id,
            editionCode,
            sequence: parseInt(sequentialId.slice(-4)),
            printed: false,
            sentWhatsApp: false,
          },
        });
        created.push(command);
      }
    }
    return created;
  }

  async generateSequentialId(editionCode: number): Promise<string> {
    // Busca última comanda da edição/ano
    const lastCommand = await this.prisma.command.findFirst({
      where: { editionCode },
      orderBy: { sequence: 'desc' },
    });

    const nextSequence = lastCommand ? lastCommand.sequence + 1 : 1;

    // Formato: YY (2 dígitos ano) + E (edição) + NNNN (sequência com 4 dígitos)
    const sequentialId = `${editionCode}${nextSequence.toString().padStart(4, '0')}`;

    return sequentialId;
  }

  async createCommand(orderOnlineId: string, editionCode: number) {
    const sequentialId = await this.generateSequentialId(editionCode);

    return await this.prisma.command.create({
      data: {
        sequentialId,
        orderOnlineId,
        editionCode,
        sequence: parseInt(sequentialId.slice(-4)), // últimos 4 dígitos
        printed: false,
        sentWhatsApp: false,
      },
    });
  }

  async findNextUnprinted() {
    return await this.prisma.command.findFirst({
      where: { printed: false, order: { deliveryOption: 'delivery' } },
      orderBy: { createdAt: 'asc' }, // FIFO - primeira criada primeiro
      include: {
        order: {
          include: { customer: true, seller: true, preOrderItems: true },
        },
      },
    });
  }

  async markAsPrinted(commandId: string, pdfUrl?: string) {
    return await this.prisma.command.update({
      where: { id: commandId },
      data: {
        printed: true,
        pdfUrl,
        sentAt: new Date(),
      },
    });
  }

  async markAsUnprinted(commandId: string) {
    return await this.prisma.command.update({
      where: { id: commandId },
      data: {
        printed: false,
      },
    });
  }

  async markAsSent(commandId: string) {
    return await this.prisma.command.update({
      where: { id: commandId },
      data: { sentWhatsApp: true },
    });
  }

  async listCommands(type: DeliveryOptionEnum) {
    return this.prisma.command.findMany({
      where: {
        order: {
          deliveryOption: type,
        },
      },
      include: {
        order: {
          include: {
            customer: { include: { addresses: true } },
            preOrderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
