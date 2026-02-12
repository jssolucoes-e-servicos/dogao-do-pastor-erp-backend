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
import { SellersService } from 'src/modules/sellers/services/sellers.service';
import { DefinePaymetnDTO } from '../dto/define-payment.dto';
import { ForDeliveryDTO } from '../dto/for-delivery.dto';
import { ForDonationDTO } from '../dto/for-donation.dto';
import { InitOrderDto } from '../dto/init-order.dto';
import { OrderIdOnly } from '../dto/order-id-only.dto';
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
  }

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
    return this.paginate(query, {
      include: {
        customer: true,
        seller: true,
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

  async upStep(orderId: string): Promise<OrderEntity> {
    const orderOr = await this.model.findUnique({
      where: { id: orderId },
      select: { siteStep: true },
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
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    await this.model.update({
      where: { id: dto.orderId },
      data: {
        addressId: dto.customerAddressId,
        observations: `${order.observations} - PARA ANALISE: distância ${dto.distance}KM`,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.ANALYSIS,
      },
    });
    return this.findById(dto.orderId);
  }

  async setDonation(dto: ForDonationDTO): Promise<OrderEntity> {
    const order = await this.model.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const partner = await this.prisma.partner.findUnique({
      where: { id: dto.partnerId, approved: true, active: true },
    });
    if (!partner) {
      throw new NotFoundException('Parceiro não identificado');
    }

    await this.model.update({
      where: { id: dto.orderId },
      data: {
        partnerId: dto.partnerId,
        deliveryOption: DeliveryOptionEnum.DONATE,
        status: OrderStatusEnum.DIGITATION,
        siteStep: SiteOrderStepEnum.PAYMENT,
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
}
