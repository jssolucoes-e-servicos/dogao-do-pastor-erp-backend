import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
import { OrdersNotificationsService } from 'src/modules/evolution/services/notifications/orders-notifications.service';
import { OrdersService } from 'src/modules/orders/services/orders.service';
import { MpPaymentsService } from './mercadopago/mp-payments.service';
import { CommandsGateway } from '../../commands/gateways/commands.gateway';
import { CommandsService } from '../../commands/services/commands.service';

@Injectable()
export class PaymentsTasksService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly mpPaymentsService: MpPaymentsService,
    private readonly ordersService: OrdersService,
    private readonly ordersNotificationsService: OrdersNotificationsService,
    private readonly commandsGateway: CommandsGateway,
    private readonly commandsService: CommandsService,
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

    // Se o pagamento veio via webhook, pode não ter o order e items incluídos.
    // Buscamos o pagamento completo para garantir que temos os dados necessários para o incremento e notificações.
    let fullPayment = payment;
    if (!payment.order) {
      fullPayment = (await this.prisma.payment.findUnique({
        where: { id: payment.id },
        include: {
          order: {
            include: {
              items: true,
              customer: true,
              edition: true,
              seller: { include: { contributor: true } },
            },
          },
        },
      })) as any;

      if (!fullPayment) {
        this.logger.error(`Pagamento ${payment.id} não encontrado ao re-buscar.`);
        return;
      }
    }
    payment = fullPayment;

    const now = new Date();
    const createdAt = payment.createdAt ? new Date(payment.createdAt) : new Date();
    const paymentAgeHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    try {
      const mpPayment =
        await this.mpPaymentsService.getPaymentStatus(providerId);
      
      if (!mpPayment) {
        // Se falhar a consulta ao MP e tiver mais de 22h, aí sim cancelamos
        if (paymentAgeHours >= 22) {
          this.logger.log(`Pagamento ${payment.id} expirou (22h+) e não pôde ser consultado. Cancelando...`);
          await this.registerExpiredPayment(payment);
        }
        return;
      }

      const statusMp = mpPayment.status as string;
      
      switch (statusMp) {
        case 'approved':
          // Se está aprovado no MP, aprovamos aqui independente da idade
          await this.registerApprovedPayment(payment);
          break;
        case 'pending':
        case 'in_process':
          // Se ainda está pendente no MP, verificamos se já expirou aqui (22h)
          if (paymentAgeHours >= 22) {
            this.logger.log(`Pagamento ${payment.id} expirou no MP (22h+). Cancelando...`);
            await this.registerExpiredPayment(payment);
            return;
          }

          if (paymentAgeHours >= 6 && !(payment.order as any)?.paymentReminderSent) {
            await this.registerPaymentReminder(payment);
          }
          await this.registerPendingPayment(payment);
          break;
        case 'rejected':
        case 'cancelled':
          await this.registerFailedPayment(payment);
          break;
        default:
          this.logger.warn(`Status MP desconhecido: ${statusMp}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento ${payment.id}: ${error}`);
      
      // Fallback: se der erro na rede/MP e já tiver passado de 22h, cancelamos por precaução
      if (paymentAgeHours >= 22) {
        this.logger.warn(`Erro ao consultar MP e pagamento tem ${paymentAgeHours}h. Cancelando por expiração.`);
        await this.registerExpiredPayment(payment);
      }
    }
  }

  async registerFailedPayment(payment: PaymentEntity) {
    try {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatusEnum.PENDING_PAYMENT,
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

        // 2.1 Incrementa contador de dogs vendidos na edição
        const edition =
          (order.edition as EditionEntity) ||
          ((await getActiveEdition(tx as any)) as EditionEntity);

        if (edition) {
          const totalDogsInOrder = order.items?.length || 0;

          if (totalDogsInOrder > 0) {
            await tx.edition.update({
              where: { id: edition.id },
              data: { dogsSold: { increment: totalDogsInOrder } },
            });
          }
        }

        // 3. Cria Comanda apenas para Entrega (DELIVERY)
        // PICKUP agora é manual via Check-In no PDV
        if (order.deliveryOption === DeliveryOptionEnum.DELIVERY) {
          // Verifica se já não existe comando para este pedido (evita duplicidade em re-processamento)
          const commandExists = await tx.command.findFirst({
            where: { orderId: order.id },
          });

          if (!commandExists) {
            await this.commandsService.createCommandForOrder(tx, order as any, edition as any);
          }
        }

        // 4. Se for Doação, gera o crédito para o parceiro
        if (order.deliveryOption === DeliveryOptionEnum.DONATE) {
          // Verifica se já existe entrada de doação (evita duplicidade)
          const donationExists = await tx.donationEntry.findFirst({
            where: { orderId: order.id },
          });

          if (!donationExists) {
            await this.createDonationEntryForOrder(tx, order as any);
          }
        }
      });

      // Envia notificação fora da transaction para não travar o banco em caso de erro de rede
      await this.ordersService.sendPaymentReceive(order.id);
    } catch (error) {
      this.logger.error(`Erro registerApprovedPayment: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async auditMissingCommandsCron() {
    this.logger.log('Iniciando Cron de Auditoria de Comandas Faltantes.');
    await this.auditMissingCommands();
  }

  async auditMissingCommands() {
    try {
      const edition = await getActiveEdition(this.prisma);
      if (!edition) return;

      // Busca pedidos pagos de DELIVERY ou PICKUP que não têm comanda
      const missingOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatusEnum.PAID,
          deliveryOption: DeliveryOptionEnum.DELIVERY,
          commands: {
            none: {},
          },
          active: true,
          editionId: edition.id,
        },
      });

      if (missingOrders.length === 0) {
        this.logger.log('Auditoria: Nenhuma comanda faltante encontrada.');
        return { fixed: 0 };
      }

      this.logger.warn(
        `Auditoria: Encontrados ${missingOrders.length} pedidos pagos sem comanda. Corrigindo...`,
      );

      for (const order of missingOrders) {
        try {
          // Criamos em transação individual para não travar o loop se um falhar
          await this.prisma.$transaction(async (tx) => {
            await this.commandsService.createCommandForOrder(tx, order as any, edition as any);
          });
        } catch (err) {
          this.logger.error(
            `Erro ao criar comanda auditada para pedido ${order.id}: ${err}`,
          );
        }
      }

      this.logger.log('Auditoria de comandas finalizada.');
      return { fixed: missingOrders.length };
    } catch (error) {
      this.logger.error(`Erro na auditoria de comandas: ${error}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async auditMissingDonationsCron() {
    if (this.configs.get('NODE_ENV') === 'development') return;

    this.logger.log('Iniciando Cron de Auditoria de Doações Faltantes.');
    await this.auditMissingDonations();
  }

  async auditMissingDonations() {
    try {
      const edition = await getActiveEdition(this.prisma);
      if (!edition) return;

      // Busca pedidos pagos de DONATE que não têm entrada de doação
      const missingOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatusEnum.PAID,
          deliveryOption: DeliveryOptionEnum.DONATE,
          donationsEntries: {
            none: {},
          },
          active: true,
          editionId: edition.id,
        },
      });

      if (missingOrders.length === 0) {
        this.logger.log('Auditoria: Nenhuma doação faltante encontrada.');
        return { fixed: 0 };
      }

      this.logger.warn(
        `Auditoria: Encontrados ${missingOrders.length} pedidos de doação sem registro. Corrigindo...`,
      );

      for (const order of missingOrders) {
        try {
          await this.prisma.$transaction(async (tx) => {
            await this.createDonationEntryForOrder(tx, order as any);
          });
        } catch (err) {
          this.logger.error(
            `Erro ao criar doação auditada para pedido ${order.id}: ${err}`,
          );
        }
      }

      this.logger.log('Auditoria de doações finalizada.');
      return { fixed: missingOrders.length };
    } catch (error) {
      this.logger.error(`Erro na auditoria de doações: ${error}`);
      throw error;
    }
  }

  private async findOrCreateInternalPartner(tx: any) {
    const INTERNAL_PARTNER_CNPJ = '00000000000000';
    let internalPartner = await tx.partner.findUnique({
      where: { id: 'IVC_INTERNAL' },
    });

    if (!internalPartner) {
      internalPartner = await tx.partner.create({
        data: {
          id: 'IVC_INTERNAL',
          name: 'Dogão do Pastor / Doação Interna',
          cnpj: INTERNAL_PARTNER_CNPJ,
          phone: '00000000000',
          addressInLine:
            'Doutor João Dentice, 261, Restinga, Porto Alegre, RS',
          street: 'Doutor João Dentice',
          number: '261',
          neighborhood: 'Restinga',
          city: 'Porto Alegre',
          state: 'RS',
          zipCode: '91790530',
          responsibleName: 'Sistema',
          responsiblePhone: '00000000000',
          password: 'internal_system_partner',
          approved: false,
        },
      });
    }
    return internalPartner;
  }

  private async createDonationEntryForOrder(tx: any, order: OrderEntity) {
    let finalPartnerId = order.partnerId;

    if (!finalPartnerId || finalPartnerId === 'IVC_INTERNAL') {
      const internalPartner = await this.findOrCreateInternalPartner(tx);
      finalPartnerId = internalPartner.id;
    }

    if (!finalPartnerId) return;

    return tx.donationEntry.create({
      data: {
        partnerId: finalPartnerId,
        orderId: order.id,
        quantity: order.items?.length || 0,
        type: DonationEntryTypeEnum.CREDIT,
      },
    });
  }
}
