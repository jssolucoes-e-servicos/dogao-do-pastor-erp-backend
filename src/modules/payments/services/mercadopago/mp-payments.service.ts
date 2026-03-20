// src/modules/payments/services/mercadopago/mp-payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import { CustomerEntity } from 'src/common/entities';
import { PaymentStatusEnum } from 'src/common/enums';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { NumbersHelper } from 'src/common/helpers/number.helper';
import { StringsHelper } from 'src/common/helpers/strings.helper';
import {
  IMercadoPagoPaymentResponse,
  IMercadopagoPix,
  IMPPayment,
  IPaymentResponse,
} from 'src/common/interfaces';
import { BaseService } from 'src/common/services/base.service';
import { GenerateOrderCardDTO } from '../../dto/generate-order-card.dto';

const mpStatusMap: Record<string, PaymentStatusEnum> = {
  'approved': PaymentStatusEnum.PAID,
  'pending': PaymentStatusEnum.PENDING,
  'in_process': PaymentStatusEnum.PENDING,
  'rejected': PaymentStatusEnum.FAILED,
  // ... adicione os outros
};
@Injectable()
export class MpPaymentsService extends BaseService {
  private readonly mpClient: Payment;
  private mercadoPagoSecretKey: string; // = process.env.MERCADOPAGO_SECRET_KEY!;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    const accessToken = this.configs.get('MERCADOPAGO_ACCESS_TOKEN') as string;
    this.mercadoPagoSecretKey = this.configs.get(
      'MERCADOPAGO_SECRET_KEY',
    ) as string;
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 5000 },
    });
    this.mpClient = new Payment(client);
  }

  async processPixPayment(
    customer: {
      name: string;
      phone: string;
      email: string | null;
    },
    orderId: string,
    totalValue: number,
  ): Promise<IPaymentResponse> {
    try {
      const { first_name, last_name } = StringsHelper.splitName(customer.name);
      const phoneObj = NumbersHelper.normalizePhone(customer.phone);
      const email = StringsHelper.emailFallback(orderId, customer.email);
      const transaction_amount = Math.floor(totalValue * 100) / 100;

      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 20);

      const bodyMP = {
        transaction_amount: transaction_amount,
        description: `Compra Online Dogão: ${orderId}`,
        payment_method_id: 'pix',
        date_of_expiration: expirationDate.toISOString(),
        payer: {
          first_name,
          last_name,
          email,
          phone: phoneObj,
        },
      };

      const payment = await this.mpClient.create({
        body: bodyMP,
      });
      const pi = payment.point_of_interaction;
      const td = pi?.transaction_data;
      const pix: IMercadopagoPix = {
        qrCodeBase64: td?.qr_code_base64 ?? null,
        qrCode: td?.qr_code ?? null,
        ticketUrl: td?.ticket_url ?? null,
      };

      const response: IMPPayment = {
        id: String(payment.id),
        status: mpStatusMap[payment.status!] ?? PaymentStatusEnum.PENDING,
        detail: payment.status_detail ?? '',
        pix,
      };
      return { success: true, payment: response };
    } catch (error) {
      this.logger.error(`Erro ao processar MP-PIX: ${error}`);
      throw new BadRequestException('Erro ao processar pagamento PIX');
    }
  }

  async processCardPayment(
    dto: GenerateOrderCardDTO,
    customer: CustomerEntity,
    valueTotal: number,
  ): Promise<IPaymentResponse> {
    const providedName = dto.payer?.name ?? customer.name;
    const providedEmail = dto.payer?.email ?? customer.email;

    const { first_name, last_name } = StringsHelper.splitName(providedName);
    const email = StringsHelper.emailFallback(dto.orderId, providedEmail);
    const phoneObj = NumbersHelper.normalizePhone(customer.phone);

    try {
      this.logger.log(`Compra Online: ${dto.orderId} -> Iniciando MP - Cartão`);
      const payment = await this.mpClient.create({
        body: {
          transaction_amount: valueTotal,
          description: `Compra Online Dogão: ${dto.orderId}`,
          token: dto.token,
          installments: dto.installments ?? 1,
          payer: { first_name, last_name, email, phone: phoneObj },
        },
      });
      this.logger.log(
        `Compra Online: ${dto.orderId} -> Resposta MP: ${payment.status}`,
      );
      const response: IMPPayment = {
        id: String(payment.id),
        status:
          (payment.status as PaymentStatusEnum) ?? PaymentStatusEnum.PENDING,
        detail: payment.status_detail ?? '',
      };
      return { success: true, payment: response };
    } catch (err: any) {
      this.logger.error(
        `Compra Online: ${dto.orderId} -> Erro ao processar cartão: ${err?.response ?? err}`,
      );
      const msg = err?.response?.message ?? err?.message;
      throw new BadRequestException(
        msg || 'Erro ao processar pagamento com cartão',
      );
    }
  }

  async getPaymentStatus(
    paymentId: string,
  ): Promise<IMercadoPagoPaymentResponse | null> {
    try {
      this.logger.log(
        `Consultando status do pagamento ${paymentId} no Mercado Pago...`,
      );
      const response = await this.mpClient.get({ id: paymentId });
      return response as IMercadoPagoPaymentResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Erro ao consultar pagamento ${paymentId} no Mercado Pago: ${error.message}`,
        );
      } else {
        // Se não for um objeto Error, trata como uma string ou outro tipo
        this.logger.error(
          `Erro desconhecido ao consultar pagamento ${paymentId} no Mercado Pago: ${JSON.stringify(error)}`,
        );
      }
      console.error(error);
      return null;
    }
  }
}
