import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderEntity } from 'src/common/entities';
import {
  DeliveryOptionEnum,
  OrderOriginEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentOriginEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
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
import { CreatePdvOrderDto } from '../dto/create-pdv-order.dto';
import type { IPaginatedResponse } from 'src/common/interfaces';
import { CustomersService } from 'src/modules/customers/services/customers.service';
import { OrdersNotificationsService } from 'src/modules/evolution/services/notifications/orders-notifications.service';
import { SellersService } from 'src/modules/sellers/services/sellers.service';
import { TicketsService } from 'src/modules/tickets/services/tickets.service';
import { MpPaymentsService } from 'src/modules/payments/services/mercadopago/mp-payments.service';

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
    private readonly ticketsService: TicketsService,
    private readonly notifications: OrdersNotificationsService,
    @Inject(forwardRef(() => MpPaymentsService))
    private readonly mpPaymentsService: MpPaymentsService,

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
    user?: any,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    const { search, status, deliveryOption, paymentStatus } = query;

    const activeEdition = await getActiveEdition(this.prisma);
    if (!activeEdition) {
      throw new NotFoundException('Sem edição ativa');
    }

    const where: any = {
      editionId: activeEdition.id,
    };

    // Filtros Diretos
    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        where.status = { in: status.split(',') };
      } else if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    if (deliveryOption) {
      if (typeof deliveryOption === 'string' && deliveryOption.includes(',')) {
        where.deliveryOption = { in: deliveryOption.split(',') };
      } else if (Array.isArray(deliveryOption)) {
        where.deliveryOption = { in: deliveryOption };
      } else {
        where.deliveryOption = deliveryOption;
      }
    }

    if (paymentStatus) {
      if (typeof paymentStatus === 'string' && paymentStatus.includes(',')) {
        where.paymentStatus = { in: paymentStatus.split(',') };
      } else if (Array.isArray(paymentStatus)) {
        where.paymentStatus = { in: paymentStatus };
      } else {
        where.paymentStatus = paymentStatus;
      }
    }

    if (query.hasCommand === 'true') {
      where.commands = { some: { active: true } };
    } else if (query.hasCommand === 'false') {
      where.commands = { none: {} };
    }

    if (query.commandStatus) {
      if (typeof query.commandStatus === 'string' && query.commandStatus.includes(',')) {
        where.commands = { 
          some: { 
            status: { in: query.commandStatus.split(',') },
            active: true 
          } 
        };
      } else {
        where.commands = { 
          some: { 
            status: query.commandStatus,
            active: true 
          } 
        };
      }
    }

    const andFilters: any[] = [];

    // Filtro de Busca (Search)
    if (search) {
      andFilters.push({
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerCPF: { contains: search } },
          { customerPhone: { contains: search } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { cpf: { contains: search } } },
          { customer: { phone: { contains: search } } },
        ],
      });
    }

    // Filtros de Segurança (RBAC)
    const isPrivileged = user?.roles?.some((r: string) => 
      ['IT', 'ADMIN', 'FINANCE'].includes(r)
    );

    if (user && !isPrivileged) {
      const securityOR: any[] = [];

      if (user.sellerId) {
        securityOR.push({ sellerId: user.sellerId });
      }

      if (user.leaderCellId) {
        securityOR.push({ seller: { cellId: user.leaderCellId } });
      }

      if (user.supervisorNetworkId) {
        securityOR.push({ seller: { cell: { networkId: user.supervisorNetworkId } } });
      }

      if (user.deliveryPersonId) {
        securityOR.push({
          deliveryStops: { 
            some: { route: { deliveryPersonId: user.deliveryPersonId } } 
          }
        });
      }

      if (securityOR.length > 0) {
        andFilters.push({ OR: securityOR });
      }
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
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
        payments: true,
      },
    });
  }

  async findPendingPdvByCustomer(customerId: string): Promise<OrderEntity | null> {
    const edition = await getActiveEdition(this.prisma);
    if (!edition) return null;
    const order = await this.model.findFirst({
      where: {
        customerId,
        editionId: edition.id,
        status: { in: [OrderStatusEnum.DIGITATION, OrderStatusEnum.PENDING_PAYMENT] },
        active: true,
      },
      include: {
        edition: true,
        customer: true,
        seller: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return order as OrderEntity | null;
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

  async donationsForAnalysis(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    const { search } = query;

    let where = {};

    const activeEdition = await getActiveEdition(this.prisma);
    if (!activeEdition) {
      throw new NotFoundException('Sem edição ativa');
    }

    const baseWhere: any = {
      editionId: activeEdition.id,
      paymentStatus: PaymentStatusEnum.PAID,
      deliveryOption: DeliveryOptionEnum.DONATE,
    };

    if (query.includeAssigned !== 'true') {
      baseWhere.partnerId = null;
    }

    if (search) {
      where = {
        ...baseWhere,
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerCPF: { contains: search } },
          { customerPhone: { contains: search } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { cpf: { contains: search } } },
          { customer: { phone: { contains: search } } },
          { partner: { name: { contains: search, mode: 'insensitive' } } },
        ],
      };
    } else {
      where = baseWhere;
    }

    return this.paginate(query, {
      where,
      include: {
        customer: true,
        partner: true,
        items: true,
        seller: { include: { contributor: true } },
      },
      orderBy: { createdAt: 'desc' },
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
        deliveryTime: dto.scheduledTime,
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

  async sendPixCode(id: string): Promise<boolean> {
    const order = await this.model.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const payment = await this.prisma.payment.findFirst({
      where: { orderId: id, method: PaymentMethodEnum.PIX },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment?.pixCopyPaste) {
      throw new NotFoundException('Código PIX não encontrado para este pedido');
    }

    await this.notifications.pixGenerated(
      order as any,
      payment.pixCopyPaste,
      payment.pixQrcode || '',
    );
    return true;
  }

  async createPDV(dto: CreatePdvOrderDto, user: any) {
    const edition = await getActiveEdition(this.prisma);
    if (!edition) {
      throw new NotFoundException('Nenhuma edição ativa encontrada');
    }

    // 1. Upsert Customer
    const customer = await this.customersService.autoCreate({
      cpf: dto.customerCpf || dto.customerPhone,
    });

    // 1b. Validar Tickets se houver
    if (dto.ticketNumbers && dto.ticketNumbers.length > 0) {
      for (const ticketNumber of dto.ticketNumbers) {
        await this.ticketsService.validateTicket(ticketNumber, edition.id);
      }
    }

    // 2. Criar Pedido
    let finalSeller: any = null;

    // Tenta primeiro o vendedor vinculado ao usuário logado
    if (user?.sellerId) {
      finalSeller = await this.sellersService.findById(user.sellerId);
    }

    // Se não tiver usuário com vendedor, tenta o ID vindo no DTO (se for um ID válido/existente)
    if (!finalSeller && dto.sellerId && dto.sellerId !== 'pdv-default') {
      finalSeller = await this.sellersService.findById(dto.sellerId);
    }

    // Se ainda não encontrou (ou se o ID do DTO era inválido/pdv-default), usa o fallback pela tag 'dogao'
    if (!finalSeller) {
      finalSeller = await this.sellersService.findByTag('dogao');
    }

    if (!finalSeller) {
      throw new NotFoundException('Vendedor (Seller) padrão não encontrado no sistema');
    }

    const finalSellerId = finalSeller.id;
    const finalSellerTag = finalSeller.tag || 'PDV';
    const isOnlinePayment = ['PIX', 'CARD_CREDIT'].includes(dto.paymentMethod);
    const orderStatus = isOnlinePayment
      ? OrderStatusEnum.PENDING_PAYMENT
      : OrderStatusEnum.PAID;
    const paymentStatus = isOnlinePayment
      ? PaymentStatusEnum.PENDING
      : PaymentStatusEnum.PAID;

    // 2. Procurar pedido pendente existente para o mesmo cliente na edição ativa
    const existingOrder = await this.model.findFirst({
      where: {
        customerId: customer.id,
        editionId: edition.id,
        status: {
          in: [OrderStatusEnum.DIGITATION, OrderStatusEnum.PENDING_PAYMENT],
        },
        active: true,
      },
    });

    // 2b. Criar/upsert endereço se for entrega
    let addressId: string | undefined;
    if (dto.deliveryOption === DeliveryOptionEnum.DELIVERY) {
      if (dto.addressId) {
        // Use existing saved address
        addressId = dto.addressId;
      } else if (dto.address) {
        const newAddr = await this.prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            street: dto.address,
            number: '-',
            neighborhood: '-',
            city: '-',
            state: '-',
            zipCode: '-',
          },
        });
        addressId = newAddr.id;
      }
    }

    let order;
    if (existingOrder) {
      // Verificar se já existe pagamento PIX pendente com QR válido — reusar sem gerar novo
      if (dto.paymentMethod === PaymentMethodEnum.PIX) {
        const existingPix = await this.prisma.payment.findFirst({
          where: {
            orderId: existingOrder.id,
            method: PaymentMethodEnum.PIX,
            status: PaymentStatusEnum.PENDING,
            pixCopyPaste: { not: null },
          },
        });
        if (existingPix) {
          // Retorna o pedido existente sem recriar nada
          return this.findById(existingOrder.id);
        }
      }

      // Limpar itens anteriores e pagamentos pendentes para atualizar o pedido
      await this.prisma.orderItem.deleteMany({
        where: { orderId: existingOrder.id },
      });
      await this.prisma.payment.deleteMany({
        where: { orderId: existingOrder.id, status: PaymentStatusEnum.PENDING },
      });

      order = await this.model.update({
        where: { id: existingOrder.id },
        data: {
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerCPF: dto.customerCpf || '',
          sellerId: finalSellerId,
          sellerTag: finalSellerTag,
          origin: OrderOriginEnum.PDV,
          status: orderStatus,
          paymentStatus: paymentStatus,
          paymentType: dto.paymentMethod,
          totalValue: dto.totalValue,
          observations: dto.observations,
          deliveryOption: dto.deliveryOption || DeliveryOptionEnum.PICKUP,
          deliveryTime: dto.scheduledTime,
          addressId: addressId,
          siteStep: SiteOrderStepEnum.THANKS,
          items: {
            create: dto.items.map((item) => ({
              unitPrice: dto.totalValue / (dto.items.length || 1),
              removedIngredients: item.removedIngredients || [],
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });
    } else {
      order = await this.model.create({
        data: {
          editionId: edition.id,
          customerId: customer.id,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerCPF: dto.customerCpf || '',
          sellerId: finalSellerId,
          sellerTag: finalSellerTag,
          origin: OrderOriginEnum.PDV,
          status: orderStatus,
          paymentStatus: paymentStatus,
          paymentType: dto.paymentMethod,
          totalValue: dto.totalValue,
          observations: dto.observations,
          deliveryOption: dto.deliveryOption || DeliveryOptionEnum.PICKUP,
          deliveryTime: dto.scheduledTime,
          addressId: addressId,
          siteStep: SiteOrderStepEnum.THANKS,
          items: {
            create: dto.items.map((item) => ({
              unitPrice: dto.totalValue / (dto.items.length || 1),
              removedIngredients: item.removedIngredients || [],
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });
    }

    // 3. Registrar Pagamento (TICKET não existe mais no PaymentMethodEnum)
    if (dto.paymentMethod !== (PaymentMethodEnum as any).TICKET) {
      const paymentData: any = {
        orderId: order.id,
        method: dto.paymentMethod,
        value: dto.totalValue,
        status: paymentStatus,
        origin: PaymentOriginEnum.PDV,
        provider: PaymentProviderEnum.MANUAL, // Padrão para PDV
      };

      if (dto.paymentMethod === PaymentMethodEnum.PIX) {
        try {
          const pixResponse = await this.mpPaymentsService.processPixPayment(
            {
              name: dto.customerName,
              phone: dto.customerPhone,
              email: null,
            },
            order.id,
            dto.totalValue,
          );

          if (pixResponse.success && pixResponse.payment) {
            paymentData.provider = PaymentProviderEnum.MERCADOPAGO;
            paymentData.providerPaymentId = pixResponse.payment.id;
            paymentData.pixQrcode = pixResponse.payment.pix?.qrCodeBase64;
            paymentData.pixCopyPaste = pixResponse.payment.pix?.qrCode;
            paymentData.rawPayload = JSON.stringify(pixResponse);

            // PDV: não envia WhatsApp automaticamente — vendedor envia manualmente via botão
          }
        } catch (error) {
          this.logger.error(
            `Erro ao gerar PIX para pedido PDV ${order.id}: ${error}`,
          );
        }
      }

      if (dto.paymentMethod === PaymentMethodEnum.CARD_CREDIT) {
        try {
          const paymentLink = await this.mpPaymentsService.createPaymentLink(
            order.id,
            dto.customerName,
            dto.totalValue,
          );
          paymentData.paymentUrl = paymentLink;

          // Envia WhatsApp com link de pagamento para o cliente
          try {
            await this.notifications.cardGenerated(order as any, paymentLink);
          } catch (notifError) {
            this.logger.error(`Erro ao enviar WhatsApp cartão PDV ${order.id}: ${notifError}`);
          }
        } catch (error) {
          this.logger.error(
            `Erro ao gerar link de pagamento para pedido PDV ${order.id}: ${error}`,
          );
        }
      }

      await this.prisma.payment.create({
        data: paymentData,
      });
    }

    if (orderStatus === OrderStatusEnum.PAID) {
      const totalDogsInOrder = order.items?.length || 0;

      if (totalDogsInOrder > 0) {
        await this.prisma.edition.update({
          where: { id: edition.id },
          data: { dogsSold: { increment: totalDogsInOrder } },
        });
      }
    }

    // 4. Vincular Tickets
    if (dto.ticketNumbers && dto.ticketNumbers.length > 0) {
      for (const ticketNumber of dto.ticketNumbers) {
        await this.prisma.ticket.updateMany({
          where: {
            number: ticketNumber,
            active: true,
            ordered: false,
          },
          data: {
            ordered: true,
            orderId: order.id,
          },
        });
      }
    }


    return this.findById(order.id);
  }
}
