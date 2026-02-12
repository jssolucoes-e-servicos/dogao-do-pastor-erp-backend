import { Injectable, NotFoundException } from '@nestjs/common';
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
import { GenerateOrderPixDTO } from '../dto/generate-order-pix.dto';
import { UpdatePaymentDTO } from '../dto/update-payment.dto';
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
    console.log(paymentExists);

    const pix = await this.mpPaymentsService.processPixPayment(
      {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
      },
      order.id,
      order.totalValue,
    );

    console.log(pix);

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
    const paymentResponse = await this.findByOrder(dto.orderId);
    console.log(paymentResponse);
    return paymentResponse;
  }
}
