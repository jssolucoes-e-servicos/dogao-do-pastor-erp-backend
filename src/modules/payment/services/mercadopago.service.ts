import {
  OrderStatsEnum,
  PaymentMethodEnum,
  PreOrderStepEnum,
} from '@/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import { PaymentStatusEnum } from 'src/common/enums/payment-status.enum';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import {
  IMPPayment,
  IMPPix,
  IPaymentResponse,
} from '../interfaces/payment.interface';

export interface MercadoPagoPaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_detail: string;
  // Adicione outras propriedades que você usa, se necessário
  // transaction_amount: number;
  // date_approved: string;
}

export interface MercadoPagoWebhookNotification {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

@Injectable()
export class MercadoPagoService extends BaseService {
  private readonly mpClient: Payment;
  private readonly mercadoPagoSecretKey = process.env.MERCADOPAGO_SECRET_KEY!;

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionNotificationsService: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      options: { timeout: 5000 },
    });
    this.mpClient = new Payment(client);
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
    return `noemail+${preorderId}@smartchurches.com.br`;
  }

  validateWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!this.mercadoPagoSecretKey) {
      this.logger.error('MERCADOPAGO_SECRET_KEY não configurada.');
      return false;
    }

    const signatureParts = signatureHeader.split(',');
    let timestamp: string | undefined;
    let v1Signature: string | undefined;

    for (const part of signatureParts) {
      if (part.startsWith('ts=')) {
        timestamp = part.substring(3);
      } else if (part.startsWith('v1=')) {
        v1Signature = part.substring(3);
      }
    }

    if (!timestamp || !v1Signature) {
      this.logger.warn(
        'Faltando timestamp ou v1Signature no cabeçalho x-signature.',
      );
      return false;
    }

    // A assinatura é gerada a partir do template "id:[notification_id];ts:[timestamp];",
    // onde [notification_id] é o ID da notificação (que pode ser encontrado no body)
    // e [timestamp] é o valor extraído do cabeçalho.
    // O Mercado Pago simplificou a validação para usar o `rawBody` completo.
    // Vamos usar o template mais simples e robusto.

    const signatureTemplate = `id:${JSON.parse(rawBody).id};ts:${timestamp};`;

    const computedSignature = crypto
      .createHmac('sha256', this.mercadoPagoSecretKey)
      .update(signatureTemplate)
      .digest('hex');

    if (computedSignature !== v1Signature) {
      this.logger.warn('Assinatura do webhook inválida.');
      return false;
    }

    return true;
  }

  async processWebhookEvent(
    payload: MercadoPagoWebhookNotification,
  ): Promise<void> {
    this.logger.log(
      `Recebendo webhook do Mercado Pago: ${JSON.stringify(payload)}`,
    );

    const { type, data } = payload; // Usa o payload recebido como parâmetro

    if (type === 'payment') {
      const paymentId = data.id;
      this.logger.log(
        `Notificação de pagamento recebida para o ID: ${paymentId}`,
      );

      // Exemplo de lógica de negócio: buscar o status atualizado do pagamento
      try {
        const paymentDetails = await this.getPaymentStatus(paymentId);
        if (paymentDetails) {
          // Lógica para atualizar o status da ordem no banco de dados
          const order = await this.prisma.orderOnline.findFirst({
            where: { paymentId: paymentId },
          });

          if (order) {
            // Supondo que você tenha um enum para o status do pagamento
            const newStatus = paymentDetails.status;
            await this.prisma.orderOnline.update({
              where: { id: order.id },
              data: { paymentStatus: newStatus },
            });
            this.logger.log(
              `Status da ordem ${order.id} atualizado para ${newStatus}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Erro ao processar notificação de pagamento ${paymentId}: ${error}`,
        );
      }
    } else {
      this.logger.log(`Notificação recebida do tipo: ${type}`);
      // Adicione lógica para outros tipos de eventos, se necessário
    }
  }

  // ------------------ PIX ------------------
  async processPixPayment(orderOnlineId: string): Promise<IPaymentResponse> {
    const preorder = await this.prisma.orderOnline.findUnique({
      where: { id: orderOnlineId },
      include: { customer: true },
    });

    if (!preorder)
      throw new HttpException(
        'Compra Online não encontrada',
        HttpStatus.NOT_FOUND,
      );

    const customer = preorder.customer!;

    if (preorder.paymentPixQrcode && preorder.paymentId) {
      const response: IMPPayment = {
        id: String(preorder.paymentId),
        status:
          (preorder.paymentStatus as PaymentStatusEnum) ??
          PaymentStatusEnum.pending,
        detail: '',
        pix: {
          qrCodeBase64: preorder.paymentPixQrcode,
          qrCode: preorder.paymentPixCopyPaste,
          ticketUrl: null,
        },
      };
      //await this.evolutionNotificationsService.sendDeliveryNotification(customerName: string, phone: string, orderNumber: string, deliveryPersonName: string)
      return { success: true, payment: response };
    } else {
      const { first_name, last_name } = this.splitName(customer.name);
      const phoneObj = this.normalizePhone(customer.phone);
      const email = this.emailFallback(preorder.id, customer.email);

      try {
        const payment = await this.mpClient.create({
          body: {
            transaction_amount: preorder.valueTotal,
            description: `Compra Online Dogão: ${preorder.id}`,
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
            (payment.status as PaymentStatusEnum) ?? PaymentStatusEnum.pending,
          detail: payment.status_detail ?? '',
          pix,
        };

        await this.prisma.orderOnline.update({
          where: { id: preorder.id },
          data: {
            paymentStatus: PaymentStatusEnum.pending,
            paymentProvider: 'mercadopago',
            paymentId: String(payment.id),
            paymentMethod: PaymentMethodEnum.pix,
            paymentPixCopyPaste: pix.qrCode,
            paymentPixQrcode: pix.qrCodeBase64,
            status: OrderStatsEnum.pending_payment,
            step: PreOrderStepEnum.pix,
          },
        });

        return { success: true, payment: response };
      } catch (err) {
        this.logger.error(`Erro ao processar PIX: ${err}`);

        throw new HttpException(
          'Erro ao processar pagamento PIX',
          HttpStatus.BAD_REQUEST,
        );
      }
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
    const preorder = await this.prisma.orderOnline.findUnique({
      where: { id: preOrderId },
      include: { customer: true },
    });

    if (!preorder) {
      this.logger.error(`Venda Online: ${preOrderId} não encontrada`);
      throw new HttpException('Pedido não encontrado', HttpStatus.NOT_FOUND);
    }

    if (!body?.token) {
      this.logger.error(
        `Compra Online: ${preOrderId} -> Token do cartão não fornecido`,
      );
      throw new HttpException(
        'Token do cartão não fornecido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const customer = preorder.customer!;
    const providedName = body.payer?.name ?? customer.name;
    const providedEmail = body.payer?.email ?? customer.email;

    const { first_name, last_name } = this.splitName(providedName);
    const email = this.emailFallback(preorder.id, providedEmail);
    const phoneObj = this.normalizePhone(customer.phone);

    try {
      this.logger.log(`Compra Online: ${preOrderId} -> Iniciando MP - Cartão`);
      const payment = await this.mpClient.create({
        body: {
          transaction_amount: preorder.valueTotal,
          description: `Compra Online Dogão: ${preorder.id}`,
          token: body.token,
          installments: body.installments ?? 1,
          payer: { first_name, last_name, email, phone: phoneObj },
        },
      });
      this.logger.log(
        `Compra Online: ${preOrderId} -> Resposta MP: ${payment.status}`,
      );
      const response: IMPPayment = {
        id: String(payment.id),
        status:
          (payment.status as PaymentStatusEnum) ?? PaymentStatusEnum.pending,
        detail: payment.status_detail ?? '',
      };

      await this.prisma.orderOnline.update({
        where: { id: preorder.id },
        data: {
          paymentStatus:
            payment.status === 'approved'
              ? PaymentStatusEnum.approved
              : PaymentStatusEnum.pending,
          paymentProvider: 'mercadopago',
          paymentId: String(payment.id),
          paymentMethod: PaymentMethodEnum.card,
          step:
            payment.status === 'approved'
              ? PreOrderStepEnum.tanks
              : PreOrderStepEnum.card,
          status:
            payment.status === 'approved'
              ? OrderStatsEnum.payd
              : OrderStatsEnum.pending_payment,
          paymentPixCopyPaste: null,
          paymentPixQrcode: null,
        },
      });

      return { success: true, payment: response };
    } catch (err: any) {
      this.logger.error(
        `Compra Online: ${preOrderId} -> Erro ao processar cartão: ${err?.response ?? err}`,
      );
      const msg = err?.response?.message ?? err?.message;
      throw new HttpException(
        msg || 'Erro ao processar pagamento com cartão',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ------------------ VERIFICAR PAGAMENTOS MANUALMENTE ------------------
  async getPaymentStatus(
    paymentId: string,
  ): Promise<MercadoPagoPaymentResponse | null> {
    try {
      this.logger.log(
        `Consultando status do pagamento ${paymentId} no Mercado Pago...`,
      );
      const response = await this.mpClient.get({ id: paymentId });
      return response as MercadoPagoPaymentResponse;
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
