// src/modules/payment/services/payments-tasks.service.ts

import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';

import { EditionEntity, OrderEntity, PaymentEntity } from 'src/common/entities';
import {
  DeliveryOptionEnum,
  DonationEntryTypeEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  SiteOrderStepEnum,
} from 'src/common/enums';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import { OrdersService } from 'src/modules/orders/services/orders.service';
import { OrdersNotificationsService } from 'src/modules/evolution/services/notifications/orders-notifications.service';
import { MpPaymentsService } from './mercadopago/mp-payments.service';

@Injectable()
export class PaymentsTasksService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly mpPaymentsService: MpPaymentsService,
    private readonly ordersService: OrdersService,
    private readonly ordersNotificationsService: OrdersNotificationsService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async processPendingPayments() {
    try {
      const pendents = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatusEnum.PENDING,
          active: true,
        },
        include: {
          order: {
            include: {
              customer: true,
              edition: true,
              seller: {
                include: {
                  contributor: true,
                },
              },
              items: true,
              commands: true,
              deliveryStops: true,
            },
          },
        },
      });

      if (pendents.length === 0) return;

      this.logger.log(`Encontrados ${pendents.length} pagamentos pendentes.`);

      for (const paymenPending of pendents) {
        // Usamos "as any" aqui porque o retorno do Prisma com múltiplos includes
        // raramente bate 100% com as Entities manuais devido às relações circulares.
        await this.handlePendingPayments(paymenPending as any);
      }

      this.logger.log(`Processamento finalizado.`);
    } catch (error) {
      this.logger.error(`Erro ao buscar pagamentos pendentes: ${error}`);
    }
  }

  async handlePendingPayments(payment: PaymentEntity) {
    const providerId = payment.providerPaymentId;

    if (!providerId) {
      this.logger.warn(`Pagamento ${payment.id} sem providerPaymentId.`);
      return;
    }

    const now = new Date();
    // A data de createdAt já vem no objeto do Prisma, por segurança usamos fallback
    const createdAt = payment.createdAt ? new Date(payment.createdAt) : new Date();
    const paymentAgeHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // 22h Expiration Check (Prioridade Absoluta)
    if (paymentAgeHours >= 22) {
      this.logger.log(`Pagamento ${payment.id} expirou (22h+). Cancelando...`);
      await this.registerExpiredPayment(payment);
      return;
    }

    try {
      const mpPayment =
        await this.mpPaymentsService.getPaymentStatus(providerId);
      if (!mpPayment) return;

      const statusMp = mpPayment.status as string;
      // Importante: mpPayment.status vem do Mercado Pago (string)
      switch (statusMp) {
        case 'approved':
          await this.registerApprovedPayment(payment);
          break;
        case 'pending':
        case 'in_process':
          if (paymentAgeHours >= 6 && !(payment.order as any)?.paymentReminderSent) {
            await this.registerPaymentReminder(payment);
          }
          await this.registerPendingPayment(payment);
          break;
        case 'rejected':
        case 'cancelled':
          //case 'refunded':
          await this.registerFailedPayment(payment);
          break;
        default:
          this.logger.warn(`Status MP desconhecido: ${statusMp}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento ${payment.id}: ${error}`);
    }
  }

  async registerFailedPayment(payment: PaymentEntity) {
    try {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatusEnum.REJECTED,
            paymentStatus: PaymentStatusEnum.FAILED,
          },
        }),
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatusEnum.FAILED },
        }),
      ]);
    } catch (error) {
      this.logger.error(`Erro registerFailedPayment: ${error}`);
    }
  }

  async registerExpiredPayment(payment: PaymentEntity) {
    try {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatusEnum.PENDING_PAYMENT,
            siteStep: SiteOrderStepEnum.PAYMENT,
            paymentType: PaymentMethodEnum.UNDEFINED,
            paymentStatus: PaymentStatusEnum.CANCELLED,
          },
        }),
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatusEnum.CANCELLED },
        }),
      ]);
      await this.ordersNotificationsService.paymentExpired(payment.order as any);
    } catch (error) {
      this.logger.error(`Erro registerExpiredPayment: ${error}`);
    }
  }

  async registerPaymentReminder(payment: PaymentEntity) {
    try {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentReminderSent: true } as any,
      });
      await this.ordersNotificationsService.paymentReminder(payment.order as any);
    } catch (error) {
      this.logger.error(`Erro registerPaymentReminder: ${error}`);
    }
  }

  async registerPendingPayment(payment: PaymentEntity) {
    try {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatusEnum.PENDING_PAYMENT,
            paymentStatus: PaymentStatusEnum.PENDING,
          },
        }),
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatusEnum.PENDING },
        }),
      ]);
    } catch (error) {
      this.logger.error(`Erro registerPendingPayment: ${error}`);
    }
  }

  async registerApprovedPayment(payment: PaymentEntity) {
    try {
      const order = payment.order as OrderEntity;

      await this.prisma.$transaction(async (tx) => {
        // 1. Atualiza Pedido
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatusEnum.PAID,
            siteStep: SiteOrderStepEnum.THANKS,
            paymentStatus: PaymentStatusEnum.PAID,
          },
        });

        // 2. Atualiza Pagamento
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatusEnum.PAID },
        });

        const edition = (await getActiveEdition(tx as any)) as EditionEntity;

        // 3. Cria Comanda se for Entrega ou Balcão (Pickup)
        if (
          order.deliveryOption === DeliveryOptionEnum.DELIVERY ||
          order.deliveryOption === DeliveryOptionEnum.PICKUP
        ) {
          const sequence =
            (await tx.command.count({ where: { editionId: edition.id } })) + 1;
          await tx.command.create({
            data: {
              sequentialId: sequence.toString(),
              orderId: order.id,
              editionId: edition.id,
              editionCode: Number(edition.code),
              sequence: sequence,
            },
          });
        }

        // 4. Se for Doação, gera o crédito para o parceiro
        if (order.deliveryOption === DeliveryOptionEnum.DONATE) {
          let finalPartnerId = order.partnerId;

          // Se for doação e não tiver parceiro definido (ou for IVC_INTERNAL), criamos/usamos um parceiro padrão.
          if (!finalPartnerId || finalPartnerId === 'IVC_INTERNAL') {
            const INTERNAL_PARTNER_CNPJ = '00000000000000'; // Um CNPJ fictício para garantir unicidade do parceiro interno
            let internalPartner = await tx.partner.findUnique({
              where: { cnpj: INTERNAL_PARTNER_CNPJ },
            });

            if (!internalPartner) {
              internalPartner = await tx.partner.create({
                data: {
                  id: 'IVC_INTERNAL',
                  name: 'Dogão do Pastor / Doação Interna',
                  cnpj: INTERNAL_PARTNER_CNPJ,
                  phone: '00000000000',
                  addressInLine: 'Igreja Vida Cristã',
                  street: 'Rua Interna',
                  number: 'S/N',
                  neighborhood: 'Centro',
                  city: 'Local',
                  state: 'SP',
                  zipCode: '00000000',
                  responsibleName: 'Sistema',
                  responsiblePhone: '00000000000',
                  password: 'internal_system_partner',
                  approved: false, // Fica false para não listar no portal de parceiros conforme solicitado
                },
              });
            }

            finalPartnerId = internalPartner.id;
          }

          if (finalPartnerId) {
            await tx.donationEntry.create({
              data: {
                partnerId: finalPartnerId,
                orderId: order.id,
                quantity: order.items?.length || 0,
                type: DonationEntryTypeEnum.CREDIT,
              },
            });
          }
        }
      });

      // Envia notificação fora da transaction para não travar o banco em caso de erro de rede
      await this.ordersService.sendPaymentReceive(order.id);
    } catch (error) {
      this.logger.error(`Erro registerApprovedPayment: ${error}`);
    }
  }
}
