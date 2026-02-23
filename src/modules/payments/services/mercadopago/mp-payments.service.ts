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
import { BaseService } from 'src/common/services/base.service';
import { GenerateOrderCardDTO } from '../../dto/generate-order-card.dto';
import { IMercadopagoPix } from '../../interfaces/mercadopago/mercadopago-pix.interface';
import { IMPPayment, IPaymentResponse } from '../../interfaces/payment.interface';

@Injectable()
export class MpPaymentsService extends BaseService {
  private readonly mpClient: Payment;
  private readonly mercadoPagoSecretKey = process.env.MERCADOPAGO_SECRET_KEY!;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    const accessToken = this.configs.get('MERCADOPAGO_ACCESS_TOKEN')!;
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

      const bodyMP = {
        transaction_amount: transaction_amount,
        description: `Compra Online Dogão: ${orderId}`,
        payment_method_id: 'pix',
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
        status: payment.status ?? 'pending',
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
}
