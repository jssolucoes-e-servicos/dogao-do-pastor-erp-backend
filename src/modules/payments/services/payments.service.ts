// src/modules/payments/services/payments.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentEntity } from 'src/common/entities';
import { PaymentMethodEnum, PaymentOriginEnum, PaymentProviderEnum, PaymentStatusEnum } from 'src/common/enums';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PaginationQueryDto,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreatePaymentDTO } from '../dto/create-payment.dto';
import { GenerateOrderCardDTO } from '../dto/generate-order-card.dto';
import { GenerateOrderPixDTO } from '../dto/generate-order-pix.dto';
import { UpdatePaymentDTO } from '../dto/update-payment.dto';
import { OrdersNotificationsService } from 'src/modules/evolution/services/notifications/orders-notifications.service';
import { MpPaymentsService } from './mercadopago/mp-payments.service';

@Injectable()
export class PaymentsService extends BaseCrudService<
  PaymentEntity,
  CreatePaymentDTO,
  UpdatePaymentDTO,
  PrismaBase.PaymentDelegate
> {
  protected model: PrismaBase.PaymentDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly mpPaymentsService: MpPaymentsService,
    private readonly ordersNotificationsService: OrdersNotificationsService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.payment;
  }

  async create(dto: CreatePaymentDTO): Promise<PaymentEntity> {
    return await super.create(dto);
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<PaymentEntity>> {
    return this.paginate(query, {
      orderBy: {
        status: 'asc',
      },
    });
  }

  async findById(id: string): Promise<PaymentEntity> {
    return super.findById(id);
  }

  async findByOrder(id: string): Promise<PaymentEntity> {
    const payment = await this.model.findFirst({
      where: {
        orderId: id,
      },
    });
    return payment as any;
  }

  async update(id: string, dto: UpdatePaymentDTO): Promise<PaymentEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<PaymentEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<PaymentEntity> {
    return super.restoreData({ id });
  }

  async CreateOrderPIX(dto: GenerateOrderPixDTO): Promise<PaymentEntity> {
    console.log('iniciando api pagamento');
    const order = await this.prisma.order.findUnique({
      where: {
        id: dto.orderId,
      },
      include: {
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado!');
    }

    const paymentExists = await this.findByOrder(dto.orderId);
    if (paymentExists) {
      if (paymentExists.method === PaymentMethodEnum.PIX) {
        return paymentExists;
      }
      await super.update(dto.orderId, {
        pixCopyPaste: null,
        pixQrcode: null,
        providerPaymentId: null,
        paymentUrl: null,
        rawPayload: null,
        status: PaymentStatusEnum.PENDING,
        cardToken: null,
      });
    }

    const pix = await this.mpPaymentsService.processPixPayment(
      {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
      },
      order.id,
      order.totalValue,
    );

    const paymentPayload = {
      orderId: dto.orderId,
      origin: PaymentOriginEnum.ORDER,
      value: order.totalValue,
      status: PaymentStatusEnum.PENDING,
      provider: PaymentProviderEnum.MERCADOPAGO,
      providerPaymentId: pix.payment.id,
      method: PaymentMethodEnum.PIX,
      pixQrcode: pix.payment.pix?.qrCodeBase64,
      pixCopyPaste: pix.payment.pix?.qrCode,
      rawPayload: JSON.stringify(pix),
    };

    if (paymentExists) {
      await super.update(paymentExists.id, paymentPayload);
    } else {
      await super.create(paymentPayload);
    }

    try {
      await this.ordersNotificationsService.pixGenerated(
        order as any,
        pix.payment.pix?.qrCode || '',
        pix.payment.pix?.qrCodeBase64 || '',
      );
    } catch (e) {
      this.logger.error(`Error sending PIX generated notification: ${e}`);
    }

    const paymentResponse = await this.findByOrder(dto.orderId);
    console.log(paymentResponse);
    return paymentResponse;
  }

  async CreateOrderCard(dto: GenerateOrderCardDTO): Promise<PaymentEntity> {
    if (!dto.token) {
      throw new BadRequestException('Token do cartão não fornecido');
    }

    console.log('iniciando api pagamento');
    const order = await this.prisma.order.findUnique({
      where: {
        id: dto.orderId,
      },
      include: {
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado!');
    }

    const paymentExists = await this.findByOrder(dto.orderId);
    if (paymentExists && paymentExists.status === PaymentStatusEnum.PENDING) {
      if (paymentExists.method === PaymentMethodEnum.CARD) {
        return paymentExists;
      }
      await super.update(dto.orderId, {
        pixCopyPaste: null,
        pixQrcode: null,
        providerPaymentId: null,
        paymentUrl: null,
        rawPayload: null,
        status: PaymentStatusEnum.PENDING,
        cardToken: null,
      });
    }

    const card = await this.mpPaymentsService.processCardPayment(
      dto,
      order.customer,
      order.totalValue,
    );

    console.log(card);

    const paymentPayload = {
      orderId: dto.orderId,
      origin: PaymentOriginEnum.ORDER,
      value: order.totalValue,
      status: PaymentStatusEnum.PENDING,
      provider: PaymentProviderEnum.MERCADOPAGO,
      providerPaymentId: card.payment.id,
      method: PaymentMethodEnum.CARD,
      pixQrcode: null,
      pixCopyPaste: null,
      rawPayload: JSON.stringify(card),
      cardToken: dto.token,
    };

    if (paymentExists) {
      await super.update(paymentExists.id, paymentPayload);
    } else {
      await super.create(paymentPayload);
    }

    try {
      // Usando uma URL fictícia ou front-end de fallback para o link de pagamento do cartão
      // No MercadoPago há a init_point ou ticket_url, ou você pode gerar um link do seu próprio front
      const cardPay: any = card.payment;
      const paymentLink = cardPay?.point_of_interaction?.transaction_data?.ticket_url || cardPay?.init_point || `https://voce-pagou.com/${card.payment.id}`;
      await this.ordersNotificationsService.cardGenerated(order as any, paymentLink);
    } catch (e) {
      this.logger.error(`Error sending Card generated notification: ${e}`);
    }

    const paymentResponse = await this.findByOrder(dto.orderId);
    console.log(paymentResponse);
    return paymentResponse;
  }
}
