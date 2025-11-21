import { EDITION_ID } from '@/common/constants';
import {
  CommandStatusEnum,
  DeliveryOptionEnum,
  OrderStatsEnum,
  PreOrderStepEnum,
} from '@/common/enums';
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

  async updateCommandStatus(commandId: string, status: CommandStatusEnum) {
    return this.prisma.command.update({
      where: { id: commandId },
      data: { status: status },
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

  async listCommands(type?: DeliveryOptionEnum, status?: CommandStatusEnum) {
    const where: any = {};
    if (type) {
      where.order = { deliveryOption: type };
    }
    if (status) {
      where.status = status;
    }
    // Se ambos, filtra pelos dois!
    return this.prisma.command.findMany({
      where,
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

  async insertManual(data: any) {
    // 1. Busca ou cria cliente
    let customer: any = null;
    if (data.customerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: data.customerId },
      });
    } else {
      customer = await this.prisma.customer.create({
        data: {
          name: data.customerName,
          phone: data.phone,
          cpf: data.cpf,
        },
      });
    }

    // 2. Endereço (somente se delivery!)
    let address: any = null;
    if (data.deliveryOption === 'delivery' && data.address) {
      if (data.address.id) {
        address = await this.prisma.customerAddress.findUnique({
          where: { id: data.address.id },
        });
      } else {
        address = await this.prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            street: data.address.street,
            number: data.address.number,
            neighborhood: data.address.neighborhood,
            city: data.address.city,
            state: data.address.state,
            zipCode: data.address.zipCode,
            complement: data.address.complement,
          },
        });
      }
    }

    // 3. Usa dados do seller do próprio body (não faz busca extra)
    const { sellerId, sellerTag } = data;

    // 4. Cria pedido na orderOnline
    const orderOnline = await this.prisma.orderOnline.create({
      data: {
        editionId: EDITION_ID, // Passe pelo body ou defina um padrão
        customerId: customer.id,
        sellerId: sellerId,
        sellerTag: sellerTag,
        quantity: data.items.length,
        valueTotal: Number(data.items.length) * 19.99,
        paymentStatus: 'approved',
        paymentProvider: 'ticket',
        deliveryOption: data.deliveryOption,
        deliveryTime:
          data.deliveryOption === 'delivery' ? data.scheduledTime : null,
        customerAddressId: address?.id || null,
        observations: data.observation,
        status: OrderStatsEnum.payd,
        step: PreOrderStepEnum.tanks,
        confirmationSend: true,
        paymentMethod: 'monney',
        origin: 'TICKET',
        preOrderItems: {
          create: data.items.map((item) => ({
            removedIngredients: item.removedIngredients,
          })),
        },
      },
      include: { preOrderItems: true },
    });

    // 5. Cria comanda vinculada

    const command = await this.createCommand(orderOnline.id, 253);

    return { success: true, orderId: orderOnline.id, commandCode: command.id };
  }

  async startProduction(commandId: string) {
  }

  // Finaliza produção
  async finishProduction(commandId: string) {
    return this.updateCommandStatus(commandId, CommandStatusEnum.PRODUCED);
  }

  // Marca para expedição (gestor puxa antes)
  async markExpedition(commandId: string) {
    return this.updateCommandStatus(commandId, CommandStatusEnum.EXPEDITION);
  }

  // Marcar como entregue
  async markAsDelivered(commandId: string) {
    return this.updateCommandStatus(commandId, CommandStatusEnum.DELIVERED);
  }

  // Puxa pendentes, agrupados (fila de produção)
  async listPendingCommands(groupedBySlot = true) {
    const commands = await this.prisma.command.findMany({
      where: { status: CommandStatusEnum.PENDING },
      include: {
        order: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    // Agrupe por slot se necessário aqui antes de devolver
    if (!groupedBySlot) return commands;
    // Exemplo simples de agrupamento no service (ajuste slot conforme regra do frontend):
    const slots: Record<string, any[]> = {};
    commands.forEach((cmd) => {
      const time = cmd.order.deliveryTime || 'SEM_HORARIO';
      // Calcule slot da regra (ex: subtract 30 min, agrupamento etc)
      const hora = time.split(':')[0];
      const slot = `${hora}:${parseInt(time.split(':')[1]) < 30 ? '00' : '30'}`;
      slots[slot] = slots[slot] || [];
      slots[slot].push(cmd);
    });
    return slots;
  }
}
