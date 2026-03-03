import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderEntity } from 'src/common/entities';
import {
  DeliveryOptionEnum,
  OrderOriginEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  SiteOrderStepEnum,
} from 'src/common/enums';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CustomersService } from 'src/modules/customers/services/customers.service';
import { OrdersNotificationsService } from 'src/modules/evolution/services/notifications/orders-notifications.service';
import { SellersService } from 'src/modules/sellers/services/sellers.service';
import { DefinePaymetnDTO } from '../dto/define-payment.dto';
import { ForDeliveryDTO } from '../dto/for-delivery.dto';
import { ForDonationDTO } from '../dto/for-donation.dto';
import { InitOrderDto } from '../dto/init-order.dto';
import { OrderIdOnly } from '../dto/order-id-only.dto';
import { ResultForAnalysisDTO } from '../dto/result-for-analysis.dto';
import { SendToAnalysisDTO } from '../dto/send-to-analysis.dto';

@Injectable()
export class OrdersService extends BaseCrudService<
  OrderEntity,
  any,
  any,
  PrismaBase.OrderDelegate
> {
  protected model: PrismaBase.OrderDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly customersService: CustomersService,
    private readonly sellersService: SellersService,
    private readonly notifications: OrdersNotificationsService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.order;
  }

  private readonly STEP_FLOW: Partial<
    Record<SiteOrderStepEnum, SiteOrderStepEnum>
  > = {
    [SiteOrderStepEnum.CUSTOMER]: SiteOrderStepEnum.ORDER,
    [SiteOrderStepEnum.ORDER]: SiteOrderStepEnum.DELIVERY,
    [SiteOrderStepEnum.DELIVERY]: SiteOrderStepEnum.PAYMENT,
  };

  private readonly STEP_DOWNFLOW: Partial<
    Record<SiteOrderStepEnum, SiteOrderStepEnum>
  > = {
    [SiteOrderStepEnum.ORDER]: SiteOrderStepEnum.CUSTOMER,
    [SiteOrderStepEnum.DELIVERY]: SiteOrderStepEnum.ORDER,
    [SiteOrderStepEnum.PAYMENT]: SiteOrderStepEnum.DELIVERY,
    [SiteOrderStepEnum.PIX]: SiteOrderStepEnum.PAYMENT,
    [SiteOrderStepEnum.CARD]: SiteOrderStepEnum.PAYMENT,
  };

  private readonly STEP_PAYMENT_FLOW: Partial<
    Record<PaymentMethodEnum, SiteOrderStepEnum>
  > = {
    [PaymentMethodEnum.PIX]: SiteOrderStepEnum.PIX,
    [PaymentMethodEnum.CARD]: SiteOrderStepEnum.CARD,
    [PaymentMethodEnum.CARD_CREDIT]: SiteOrderStepEnum.PAYMENT,
    [PaymentMethodEnum.CARD_DEBIT]: SiteOrderStepEnum.PAYMENT,
    [PaymentMethodEnum.MONEY]: SiteOrderStepEnum.PAYMENT,
    [PaymentMethodEnum.POS]: SiteOrderStepEnum.PAYMENT,
    [PaymentMethodEnum.UNDEFINED]: SiteOrderStepEnum.PAYMENT,
  };

  async initOrder(dto: InitOrderDto) {
    /** 1️⃣ Cliente */
    const customerBase = await this.customersService.autoCreate({
      cpf: dto.cpf,
    });

    /** 2️⃣ Edição ativa */
    const edition = await getActiveEdition(this.prisma);
    if (!edition) {
      throw new NotFoundException('Nenhuma edição ativa encontrada');
    }

    /** 3️⃣ Pedido em DIGITAÇÃO existente */
    const existingOrder = await this.model.findFirst({
      where: {
        customerId: customerBase.id,
        editionId: edition.id,
        status: OrderStatusEnum.DIGITATION,
        active: true,
      },
      include: {
        items: true,
        customer: {
          include: {
            addresses: true,
          },
        },
      },
    });

    if (existingOrder) {
      return {
        order: existingOrder,
        customer: existingOrder.customer,
        addresses: existingOrder.customer.addresses ?? [],
      };
    }

    /** 4️⃣ Vendedor */
    const seller = await this.sellersService.findByTag(dto.sellerTag);
    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado');
    }

    /** 5️⃣ Criar pedido */
    const order = await this.model.create({
      data: {
        editionId: edition.id,
        customerId: customerBase.id,
        customerName: customerBase.name,
        customerPhone: customerBase.phone,
        customerCPF: customerBase.cpf!,
        sellerId: seller.id,
        sellerTag: seller.tag,
        origin: OrderOriginEnum.SITE,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.CUSTOMER,
        totalValue: 0,
      },
      include: {
        items: true,
        customer: {
          include: {
            addresses: true,
          },
        },
      },
    });

    const customer = order.customer;

    return {
      order,
      customerAddresses: customer.addresses ?? [],
    };
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    const { search } = query;

    let where = {};

    const activeEdition = await getActiveEdition(this.prisma);
    if (!activeEdition) {
      throw new NotFoundException('Sem edição ativa');
    }

    if (search) {
      where = {
        editionId: activeEdition.id,
        OR: [
          {
            customerName: { contains: search, mode: 'insensitive' },
          },
          {
            customerCPF: { contains: search },
          },
          {
            customerPhone: { contains: search },
          },
          {
            customer: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            customer: {
              cpf: { contains: search },
            },
          },
          {
            customer: {
              phone: { contains: search },
            },
          },
        ],
      };
    }

    return this.paginate(query, {
      where,
      include: {
        customer: true,
        seller: {
          include: {
            contributor: true,
          },
        },
        items: true,
        commands: true,
        deliveryStops: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<OrderEntity> {
    return super.findById(id, {
      include: {
        edition: true,
        customer: true,
        seller: true,
        items: true,
        commands: true,
        deliveryStops: true,
      },
    });
  }

  async findByCustomerId(id: string): Promise<OrderEntity> {
    return super.findOne({ customerId: id });
  }

  async findBySellerId(id: string): Promise<OrderEntity> {
    return super.findOne({ sellerId: id });
  }

  async findByEditionId(id: string): Promise<OrderEntity> {
    return super.findOne({ editionId: id });
  }

  async update(id: string, dto: any): Promise<OrderEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<OrderEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<OrderEntity> {
    return super.restoreData({ id });
  }

  async pendingAnalysis(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    const { search } = query;

    let where = {};

    const activeEdition = await getActiveEdition(this.prisma);
    if (!activeEdition) {
      throw new NotFoundException('Sem edição ativa');
    }

    if (search) {
      where = {
        editionId: activeEdition.id,
        siteStep: SiteOrderStepEnum.ANALYSIS,
        OR: [
          {
            customerName: { contains: search, mode: 'insensitive' },
          },
          {
            customerCPF: { contains: search },
          },
          {
            customerPhone: { contains: search },
          },
          {
            customer: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            customer: {
              cpf: { contains: search },
            },
          },
          {
            customer: {
              phone: { contains: search },
            },
          },
        ],
      };
    } else {
      where = {
        editionId: activeEdition.id,
        siteStep: SiteOrderStepEnum.ANALYSIS,
      };
    }

    return this.paginate(query, {
      where,
      include: {
        customer: true,
        seller: {
          include: {
            contributor: true,
          },
        },
        items: true,
        address: true,
        commands: true,
        deliveryStops: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async upStep(orderId: string): Promise<OrderEntity> {
    const orderOr = await this.model.findUnique({
      where: { id: orderId },
      select: { siteStep: true, customerId: true },
    });

    if (!orderOr) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const actualStep = orderOr.siteStep as unknown as SiteOrderStepEnum;
    // Se existir no mapa, pega o próximo, senão mantém o atual
    const newStep = this.STEP_FLOW[actualStep] || actualStep;
    if (newStep !== actualStep) {
      await this.model.update({
        where: { id: orderId },
        data: { siteStep: newStep },
      });
    }
    await this.prisma.customer.update({
      where: { id: orderOr.customerId },
      data: {
        firstRegister: false,
      },
    });
    return this.findById(orderId);
  }

  async downstep(orderId: string): Promise<OrderEntity> {
    const orderOr = await this.model.findUnique({
      where: { id: orderId },
      select: { siteStep: true, customerId: true, },
    });

    if (!orderOr) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const actualStep = orderOr.siteStep as unknown as SiteOrderStepEnum;
    // Se existir no mapa, pega o próximo, senão mantém o atual
    const newStep = this.STEP_DOWNFLOW[actualStep] || actualStep;
    if (newStep !== actualStep) {
      await this.model.update({
        where: { id: orderId },
        data: { siteStep: newStep },
      });
    }
    await this.prisma.customer.update({
      where: { id: orderOr.customerId },
      data: {
        firstRegister: false,
      },
    });
    return this.findById(orderId);
  }

  async definePayment(dto: DefinePaymetnDTO): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: {
        id: dto.orderId,
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado!');
    }
    await this.prisma.customer.update({
      where: { id: order.customerId },
      data: {
        firstRegister: false,
      },
    });
    const newStep = this.STEP_PAYMENT_FLOW[dto.method];
    await this.model.update({
      where: { id: dto.orderId },
      data: {
        paymentType: dto.method,
        siteStep: newStep,
      },
    });
    return this.findById(dto.orderId);
  }

  async setAnalysisStatus(dto: SendToAnalysisDTO): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id: dto.orderId },
      include: {
        customer: true,
      }
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    await this.prisma.customer.update({
      where: { id: order.customerId },
      data: {
        firstRegister: false,
      },
    });
    await this.model.update({
      where: { id: dto.orderId },
      data: {
        addressId: dto.customerAddressId,
        observations: `${order.observations} - PARA ANALISE: distância ${dto.distance}KM`,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.ANALYSIS,
      },
    });
    await this.notifications.sendAnalisys(
      order.id,
      order.customer?.phone,
      order.customerName,
      order.customerCPF,
      dto.distance.toString(),
    );
    return this.findById(dto.orderId);
  }

  async resultAnalysis(dto: ResultForAnalysisDTO): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id: dto.orderId },
      include: {
        customer: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    await this.prisma.customer.update({
      where: { id: order.customerId },
      data: {
        firstRegister: false,
      },
    });
    await this.model.update({
      where: { id: dto.orderId },
      data: {
        observations: `${order.observations} \n\n RESPOSTA: ${dto.observations}`,
        status: dto.approved
          ? OrderStatusEnum.PENDING_PAYMENT
          : OrderStatusEnum.DIGITATION,
        siteStep: dto.approved
          ? SiteOrderStepEnum.PAYMENT
          : SiteOrderStepEnum.DELIVERY,
      },
    });
    await this.notifications.responseAnalisys(
      order.customer.phone,
      order.id,
      dto.approved,
    );
    return this.findById(dto.orderId);
  }

  async setDonation(dto: ForDonationDTO): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.prisma.customer.update({
      where: { id: order.customerId },
      data: {
        firstRegister: false,
      },
    });

    let finalPartnerId: string | null = null;

    if (dto.partnerId !== 'IVC_INTERNAL') {
      const partner = await this.prisma.partner.findUnique({
        where: { id: dto.partnerId, approved: true, active: true },
      });

      if (!partner) {
        throw new NotFoundException('Parceiro não identificado ou inativo');
      }

      finalPartnerId = partner.id;
    }

    // LÓGICA DE PRESERVAÇÃO DAS OBSERVAÇÕES
    let updatedObservations = order.observations || '';
    if (dto.observations && dto.observations.trim().length > 0) {
      const separator = updatedObservations.length > 0 ? '\n\n' : '';
      updatedObservations = `${updatedObservations}${separator}${dto.observations.trim()}`;
    }

    await this.model.update({
      where: { id: dto.orderId },
      data: {
        partnerId: finalPartnerId,
        deliveryOption: DeliveryOptionEnum.DONATE,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.PAYMENT,
        observations: updatedObservations, // Agora com o conteúdo acumulado
      },
    });
    return this.findById(dto.orderId);
  }

  async setDelivery(dto: ForDeliveryDTO): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.prisma.customer.update({
      where: { id: order.customerId },
      data: {
        firstRegister: false,
      },
    });

    const address = await this.prisma.customerAddress.findUnique({
      where: { id: dto.addressId },
    });
    if (!address) {
      throw new NotFoundException('Parceiro não identificado');
    }
    if (address.customerId !== order.customerId) {
      throw new NotFoundException(
        'Ops! O endereço não pertence a este cliente.',
      );
    }

    await this.model.update({
      where: { id: dto.orderId },
      data: {
        addressId: dto.addressId,
        deliveryOption: DeliveryOptionEnum.DELIVERY,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.PAYMENT,
      },
    });
    return this.findById(dto.orderId);
  }

  async setPickup(dto: OrderIdOnly): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.model.update({
      where: { id: dto.orderId },
      data: {
        deliveryOption: DeliveryOptionEnum.PICKUP,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.PAYMENT,
      },
    });
    return this.findById(dto.orderId);
  }

  async changePaymentMethod(id: string): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    await super.update(id, {
      paymentType: PaymentMethodEnum.UNDEFINED,
      siteStep: SiteOrderStepEnum.PAYMENT,
    });
    return this.findById(id);
  }

  async sendPaymentReceive(id: string): Promise<boolean> {
    const order = await this.model.findUnique({
      where: { id },
      include: {
        items: true,
        edition: true,
        customer: true,
        seller: {
          include: {
            contributor: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    await this.notifications.paymentReceived(
      order,
      order.customerPhone,
      order.customerName,
      order.items?.length,
      order.totalValue,
      order.paymentType,
    );
    return true;
  }
}
