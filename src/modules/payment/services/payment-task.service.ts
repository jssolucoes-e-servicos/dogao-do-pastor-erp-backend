// src/modules/payment/services/payment-task.service.ts
import { OrderStatsEnum, PreOrderStepEnum } from '@/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable } from '@nestjs/common';
import { EvolutionNotificationsService } from '../../evolution/services/evolution-notifications.service';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentTaskService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly evolutionNotificationsService: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
  }

  //call in crons
  async handlePendingPayments() {
    this.logger.log('Iniciando verificação de pagamentos pendentes...');

    try {
      const pendents = await this.prisma.orderOnline.findMany({
        where: {
          paymentStatus: 'pending',
          status: 'digitation',
          OR: [{ step: 'pix' }, { step: 'card' }],
        },
        include: {
          customer: true,
        },
      });

      if (pendents.length === 0) {
        this.logger.log('Nenhum pagamento pendente encontrado.');
        return;
      }

      this.logger.log(`Encontrados ${pendents.length} pagamentos pendentes.`);

      for (const order of pendents) {
        const paymentId = order.paymentId;

        if (!paymentId) {
          this.logger.warn(
            `Ordem ${order.id} não possui mercadopagoPaymentId. Pulando.`,
          );
          continue;
        }

        const mpPayment =
          await this.mercadoPagoService.getPaymentStatus(paymentId);

        if (!mpPayment) {
          // O erro já foi logado no MercadoPagoService, então continuamos.
          continue;
        }

        const mpPaymentStatus = mpPayment.status;
        //const mpPaymentStatusDetail = mpPayment.status_detail;

        let newPaymentStatus: string;
        let newOrderStatus = order.status;
        let newStep = order.step;
        let sendNotification: boolean = false;
        switch (mpPaymentStatus) {
          case 'approved':
            {
              sendNotification = true;
              newPaymentStatus = 'approved';
              newOrderStatus = OrderStatsEnum.payd;
              newStep = PreOrderStepEnum.tanks;
            }
            break;
          case 'pending':
            {
              newPaymentStatus = 'pending';
              newOrderStatus = OrderStatsEnum.pending_payment;
              newStep = order.step;
            }
            break;
          case 'rejected':
          case 'cancelled':
            {
              newPaymentStatus = 'rejected';
              newOrderStatus = OrderStatsEnum.pending_payment;
              newStep = PreOrderStepEnum.payment;
            }
            break;
          default:
            newPaymentStatus = 'unknown';
            this.logger.warn(
              `Status do Mercado Pago desconhecido: ${mpPaymentStatus} para a ordem ${order.id}`,
            );
        }

        if (
          order.paymentStatus !== newPaymentStatus &&
          newPaymentStatus !== 'unknown' &&
          newPaymentStatus !== 'pending'
        ) {
          await this.prisma.orderOnline.update({
            where: { id: order.id },
            data: {
              paymentStatus: newPaymentStatus,
              status: newOrderStatus,
              step: newStep,
            },
          });
          this.logger.log(
            `Ordem ${order.id} atualizada para o status: ${newPaymentStatus}`,
          );
        }
        if (sendNotification === true) {
          this.evolutionNotificationsService.sendConfimPayment(order);
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamentos pendentes no banco de dados: ${error}`,
      );
    }

    this.logger.log('Verificação de pagamentos pendentes finalizada.');
  }
}
