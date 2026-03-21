import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaBase as Prisma } from 'src/common/helpers/importer.helper';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
  PaginationQueryDto,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { 
  CommandEntity, 
  OrderEntity, 
  EditionEntity 
} from 'src/common/entities';
import { UpdateCommandDto } from '../dto/update-command.dto';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import { CreateManualCommandDto } from '../dto/create-manual-command.dto';
import { CustomersService } from 'src/modules/customers/services/customers.service';
import { SellersService } from 'src/modules/sellers/services/sellers.service';
import { CommandsGateway } from '../gateways/commands.gateway';
import {
  DeliveryOptionEnum,
  OrderOriginEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  SiteOrderStepEnum,
} from 'src/common/enums';

@Injectable()
export class CommandsService extends BaseCrudService<
  CommandEntity,
  any,
  UpdateCommandDto,
  PrismaBase.CommandDelegate
> {
  protected model: PrismaBase.CommandDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly customersService: CustomersService,
    private readonly sellersService: SellersService,
    private readonly gateway: CommandsGateway,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.command;
  }

  async list(query: PaginationQueryDto): Promise<IPaginatedResponse<CommandEntity>> {
    const edition = await getActiveEdition(this.prisma);
    const where: any = {
      editionId: edition?.id,
    };

    if (query.search) {
      where.OR = [
        { sequentialId: { contains: query.search, mode: 'insensitive' } },
        { order: { customerName: { contains: query.search, mode: 'insensitive' } } },
        { order: { customerPhone: { contains: query.search, mode: 'insensitive' } } },
        { withdrawal: { partner: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    if (query.deliveryOption) {
      where.order = { deliveryOption: query.deliveryOption };
    }

    return this.paginate(query, {
      where,
      include: {
        order: {
          include: {
            customer: true,
            address: true,
            items: true,
            edition: true,
            seller: { include: { contributor: true } },
          },
        },
        withdrawal: {
          include: {
            partner: true,
            items: true,
          },
        },
      },
      orderBy: { sequence: 'desc' },
    });
  }

  async findById(id: string, options?: any): Promise<CommandEntity> {
    return super.findById(id, {
      include: {
        order: {
          include: {
            items: true,
            donationsEntries: true,
            edition: true,
            seller: { include: { contributor: true } },
          },
        },
        withdrawal: {
          include: {
            partner: true,
            items: true,
          },
        },
      },
      orderBy: { sequence: 'desc' },
    }) as any;
  }

  async update(id: string, dto: UpdateCommandDto): Promise<CommandEntity> {
    // Se o status for PRODUCED, fazemos a transição inteligente
    if (dto.status === 'PRODUCED') {
      const command = await this.model.findUnique({
        where: { id },
        include: { order: true },
      });

      if (command?.order) {
        if (command.order.deliveryOption === 'PICKUP') {
          dto.status = 'EXPEDITION' as any;
        } else if (command.order.deliveryOption === 'DELIVERY') {
          dto.status = 'QUEUED_FOR_DELIVERY' as any;
        }
      }
    }

    // Verifica existência sem args extras (findUnique não aceita orderBy)
    const exists = await this.model.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) {
      throw new NotFoundException('Comanda não encontrada');
    }

    return this.model.update({ where: { id }, data: dto });
  }

  async getPendingPrint(): Promise<CommandEntity[]> {
    const edition = await getActiveEdition(this.prisma);
    return this.model.findMany({
      where: {
        printed: false,
        editionId: edition?.id,
      },
      include: {
        order: {
          include: {
            customer: true,
            address: true,
            items: true,
            donationsEntries: true,
            edition: true,
            seller: { include: { contributor: true } },
          },
        },
        withdrawal: {
          include: {
            partner: true,
            items: true,
            donationLogs: true,
          },
        },
      },
      orderBy: { sequence: 'asc' },
    }) as any;
  }

  async remove(id: string): Promise<CommandEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<CommandEntity> {
    return super.restoreData({ id });
  }

  async createManual(dto: CreateManualCommandDto): Promise<CommandEntity> {
    const edition = await getActiveEdition(this.prisma);
    if (!edition) {
      throw new NotFoundException('Nenhuma edição ativa encontrada');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Cliente
      const customer = await this.customersService.autoCreate({
        cpf: dto.cpf || dto.phone,
      });

      // 2. Endereço (se necessário)
      let addressId: string | undefined;
      if (
        (dto.deliveryOption === DeliveryOptionEnum.DELIVERY ||
          dto.deliveryOption === DeliveryOptionEnum.DONATE) &&
        dto.address
      ) {
        if (dto.address.id) {
          addressId = dto.address.id;
        } else {
          const newAddr = await tx.customerAddress.create({
            data: {
              customerId: customer.id,
              street: dto.address.street,
              number: dto.address.number,
              neighborhood: dto.address.neighborhood,
              city: dto.address.city,
              state: dto.address.state,
              zipCode: dto.address.zipCode,
              complement: dto.address.complement,
            },
          });
          addressId = newAddr.id;
        }
      }

      // 3. Vendedor
      let sellerId: string | undefined;
      if (dto.sellerId) {
        sellerId = dto.sellerId;
      } else if (dto.sellerTag) {
        const seller = await tx.seller.findFirst({
          where: { tag: dto.sellerTag, active: true },
        });
        sellerId = seller?.id;
      }

      // 4. Criar Pedido (Fluxo TICKET/Manual)
      const seller = sellerId ? await tx.seller.findUnique({ where: { id: sellerId } }) : null;

      const order = await tx.order.create({
        data: {
          editionId: edition.id,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerCPF: customer.cpf || '',
          sellerId: sellerId || 'manual-default', // Necessário um seller válido
          sellerTag: seller?.tag || 'MANUAL',
          origin: OrderOriginEnum.TICKET,
          status: OrderStatusEnum.PAID,
          paymentStatus: PaymentStatusEnum.PAID,
          paymentType: PaymentMethodEnum.MONEY, // Padrão para manual
          deliveryOption: dto.deliveryOption,
          deliveryTime: dto.scheduledTime,
          addressId: addressId,
          observations: dto.observation,
          siteStep: SiteOrderStepEnum.THANKS,
          totalValue: dto.items.length * (edition.dogPrice || 19.99), // Preço base
          items: {
            create: dto.items.map((item) => ({
              quantity: 1,
              unitPrice: edition.dogPrice || 19.99,
              removedIngredients: item.removedIngredients || [],
            })),
          },
        },
      });

      // 5. Criar Comanda
      return this.createCommandForOrder(tx, order as unknown as OrderEntity, edition);
    });
  }

  async createCommandForOrder(
    tx: any,
    order: OrderEntity,
    edition: EditionEntity,
  ): Promise<CommandEntity> {
    const lastCommand = await tx.command.findFirst({
      where: { editionId: edition.id },
      orderBy: { sequence: 'desc' },
    });

    const nextSequence = (lastCommand?.sequence || 0) + 1;
    const seqId = `${edition.code}${String(nextSequence).padStart(4, '0')}`;

    const command = await tx.command.create({
      data: {
        sequentialId: seqId,
        orderId: order.id,
        editionId: edition.id,
        editionCode: Number(edition.code),
        sequence: nextSequence,
      },
      include: {
        order: {
          include: {
            customer: true,
            address: true,
            items: true,
            edition: true,
            seller: { include: { contributor: true } },
          },
        },
      },
    });

    this.gateway.emitNewCommand(command);

    return command;
  }

  async checkIn(orderId: string): Promise<CommandEntity> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        edition: true,
        commands: { where: { active: true } }
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.paymentStatus !== PaymentStatusEnum.PAID) {
      throw new Error('Pedido ainda não está pago');
    }

    if (order.commands.length > 0) {
      throw new Error('Este pedido já possui uma comanda ativa na produção');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return this.createCommandForOrder(tx, order as any, order.edition as any);
    });
  }
}
