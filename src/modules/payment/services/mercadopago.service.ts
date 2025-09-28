import { OrderStatsEnum } from '@/common/enums';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Payment } from 'mercadopago';
import { PaymentStatusEnum } from 'src/common/enums/payment-status.enum';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import {
  IMPPayment,
  IMPPix,
  IPaymentResponse,
} from '../interfaces/payment.interface';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly mpClient: Payment;

  constructor(private readonly prisma: PrismaService) {
    this.mpClient = new Payment({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
  }

  // ------------------ Helpers ------------------
  private normalizePhone(phoneRaw: string) {
    // Remove tudo que não é número
    const digits = phoneRaw.replace(/\D/g, '');
    const area_code = digits.length > 2 ? digits.slice(0, 2) : '00';
    const number =
      digits.length > 2 ? digits.slice(2) : digits.padStart(9, '0');
    return { area_code, number };
  }

  private splitName(fullName?: string) {
    const name = (fullName ?? '').trim();
    if (!name) return { first_name: 'Cliente', last_name: 'SmartChurch' };
    const parts = name.split(/\s+/);
    const first_name = parts.shift() || 'Cliente';
    const last_name = parts.join(' ') || 'SmartChurch';
    return { first_name, last_name };
  }

  private emailFallback(preorderId: string, existing?: string | null): string {
    if (existing && /\S+@\S+\.\S+/.test(existing)) return existing;
    return `noemail+${preorderId}@smartchurch.com`;
  }

  // ------------------ PIX ------------------
  async processPixPayment(preOrderId: string): Promise<IPaymentResponse> {
    const preorder = await this.prisma.preOrder.findUnique({
      where: { id: preOrderId },
      include: { customer: true },
    });

    if (!preorder)
      throw new HttpException('Pré-venda não encontrada', HttpStatus.NOT_FOUND);

    const customer = preorder.customer!;
    const { first_name, last_name } = this.splitName(customer.name);
    const phoneObj = this.normalizePhone(customer.phone);
    const email = this.emailFallback(preorder.id, customer.email);

    try {
      const payment = await this.mpClient.create({
        body: {
          transaction_amount: preorder.valueTotal,
          description: `Pré-venda ${preorder.id}`,
          payment_method_id: 'pix',
          payer: {
            first_name,
            last_name,
            email,
            phone: phoneObj,
          },
        },
      });

      const pi = payment.point_of_interaction;
      const td = pi?.transaction_data;
      const pix: IMPPix = {
        qrCodeBase64: td?.qr_code_base64 ?? null,
        qrCode: td?.qr_code ?? null,
        ticketUrl: td?.ticket_url ?? null,
      };

      const response: IMPPayment = {
        id: String(payment.id),
        status:
          (payment.status as PaymentStatusEnum) ?? PaymentStatusEnum.PENDING,
        detail: payment.status_detail ?? '',
        pix,
      };

      await this.prisma.preOrder.update({
        where: { id: preorder.id },
        data: {
          paymentStatus: PaymentStatusEnum.PENDING,
          paymentProvider: 'mercadopago',
          paymentId: String(payment.id),
          paymentMethod: 'PIX',
          status: OrderStatsEnum.PENDING_PAYMENT,
        },
      });

      return { success: true, payment: response };
    } catch (err: any) {
      this.logger.error('Erro ao processar PIX', err?.response ?? err);
      const msg = err?.response?.message ?? err?.message;
      throw new HttpException(
        msg || 'Erro ao processar pagamento PIX',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ------------------ CARTÃO ------------------
  async processCardPayment(
    preOrderId: string,
    body: {
      token: string;
      installments: number;
      payer?: { name?: string; email?: string };
    },
  ): Promise<IPaymentResponse> {
    const preorder = await this.prisma.preOrder.findUnique({
      where: { id: preOrderId },
      include: { customer: true },
    });

    if (!preorder)
      throw new HttpException('Pré-venda não encontrada', HttpStatus.NOT_FOUND);
    if (!body?.token)
      throw new HttpException(
        'Token do cartão não fornecido',
        HttpStatus.BAD_REQUEST,
      );

    const customer = preorder.customer!;
    const providedName = body.payer?.name ?? customer.name;
    const providedEmail = body.payer?.email ?? customer.email;

    const { first_name, last_name } = this.splitName(providedName);
    const email = this.emailFallback(preorder.id, providedEmail);
    const phoneObj = this.normalizePhone(customer.phone);

    try {
      const payment = await this.mpClient.create({
        body: {
          transaction_amount: preorder.valueTotal,
          description: `Pré-venda ${preorder.id}`,
          token: body.token,
          installments: body.installments ?? 1,
          payer: { first_name, last_name, email, phone: phoneObj },
        },
      });

      const response: IMPPayment = {
        id: String(payment.id),
        status:
          (payment.status as PaymentStatusEnum) ?? PaymentStatusEnum.PENDING,
        detail: payment.status_detail ?? '',
      };

      await this.prisma.preOrder.update({
        where: { id: preorder.id },
        data: {
          paymentStatus:
            payment.status === 'approved'
              ? PaymentStatusEnum.APPROVED
              : PaymentStatusEnum.PENDING,
          paymentProvider: 'mercadopago',
          paymentId: String(payment.id),
          paymentMethod: 'CARD',
        },
      });

      return { success: true, payment: response };
    } catch (err: any) {
      this.logger.error('Erro ao processar cartão', err?.response ?? err);
      const msg = err?.response?.message ?? err?.message;
      throw new HttpException(
        msg || 'Erro ao processar pagamento com cartão',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
