import { Injectable } from '@nestjs/common';
import { OrderEntity } from 'src/common/entities';
import { PaymentMethodEnum } from 'src/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import {
  MW_OrderDelivered,
  MW_OrderDeliveryFailed,
  MW_OrderDeliverySkiped,
  MW_OrderNewSite,
  MW_OrderNextDelivery,
  MW_OrderPaymentReceive,
  MW_OrderRecoveryAbandoned,
  MW_OrderResponseAnalisys,
  MW_OrderSendAnalisys,
  validateContact,
} from 'src/common/messages';
import { N8nService } from 'src/modules/n8n/services/n8n.service';

@Injectable()
export class OrdersNotificationsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly n8nService: N8nService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async delivered(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Entrega Feita para ${order.customer.phone}`);
      const message = MW_OrderDelivered();
      await this.n8nService.dispatchEvent('ORDER_DELIVERED', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
      });
    }
  }

  async deliveryFailed(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Falha na Entrega para ${order.customer.phone}`);
      const message = MW_OrderDeliveryFailed();
      await this.n8nService.dispatchEvent('ORDER_DELIVERY_FAILED', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
      });
    }
  }

  async deliverySkyped(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Entrega Pulada para ${order.customer.phone}`);
      const message = MW_OrderDeliverySkiped();
      await this.n8nService.dispatchEvent('ORDER_DELIVERY_SKIPED', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
      });
    }
  }

  async createdNewSite(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Nova Compra para ${order.customer.phone}`);
      const message = MW_OrderNewSite(order);
      await this.n8nService.dispatchEvent('ORDER_NEW_SITE', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
        orderTotal: order.totalValue,
      });
    }
  }

  async nextDelivery(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Próxima Parada para ${order.customer.phone}`);
      const message = MW_OrderNextDelivery(order.customerName);
      await this.n8nService.dispatchEvent('ORDER_NEXT_DELIVERY', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
      });
    }
  }

  async paymentPending24h(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Pagamento Pendente 24h para ${order.customer.phone}`);
      const message = MW_OrderRecoveryAbandoned(order.customerName);
      await this.n8nService.dispatchEvent('ORDER_PENDING_24H', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
      });
    }
  }

  async recoveryAbandoned(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Recuperação de Carrinho para ${order.customer.phone}`);
      const message = MW_OrderRecoveryAbandoned(order.customerName);
      await this.n8nService.dispatchEvent('ORDER_RECOVERY_ABANDONED', {
        orderId: order.id,
        phone: order.customer.phone,
        message,
      });
    }
  }

  async sendAnalisys(
    orderId: string,
    phone: string,
    customerName: string,
    customerCPF: string,
    distance: string,
  ) {
    if (phone) {
      this.logger.log(`Registrando notificação: Análise em Fila para: ${phone}`);
      const message = MW_OrderSendAnalisys(
        orderId,
        customerName,
        customerCPF,
        distance,
      );
      await this.n8nService.dispatchEvent('ORDER_SEND_ANALISYS', {
        orderId,
        phone,
        message,
        customerName,
      });
    }
  }

  async responseAnalisys(phone: string, orderId: string, approved: boolean) {
    if (phone) {
      this.logger.log(`Registrando notificação: Resultado Análise para ${phone}`);
      const message = MW_OrderResponseAnalisys(orderId, approved);
      await this.n8nService.dispatchEvent('ORDER_RESPONSE_ANALISYS', {
        orderId,
        phone,
        message,
        approved,
      });
    }
  }

  async paymentReceived(
    order: OrderEntity,
    phone: string,
    name: string,
    count: number,
    totalValue: number,
    paymentType: PaymentMethodEnum,
  ) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Pagamento Recebido para ${phone}`);
      const message = MW_OrderPaymentReceive(
        name,
        count,
        totalValue,
        paymentType,
      );
      await this.n8nService.dispatchEvent('ORDER_PAYMENT_RECEIVED', {
        orderId: order.id,
        phone: order.customerPhone,
        message,
        paymentType,
        totalValue,
      });
    }
  }

  async pixGenerated(order: OrderEntity, pixCopyPaste: string, qrCode: string) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: PIX Gerado para ${order.customerPhone}`);
      await this.n8nService.dispatchEvent('ORDER_PIX_GENERATED', {
        orderId: order.id,
        phone: order.customerPhone,
        customerName: order.customerName,
        totalValue: order.totalValue,
        pixCopyPaste,
        qrCode,
      });
    }
  }

  async cardGenerated(order: OrderEntity, paymentLink: string) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Cartão Gerado para ${order.customerPhone}`);
      await this.n8nService.dispatchEvent('ORDER_CARD_LINK', {
        orderId: order.id,
        phone: order.customerPhone,
        customerName: order.customerName,
        totalValue: order.totalValue,
        paymentLink,
      });
    }
  }

  async paymentReminder(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Lembrete de Pagamento 6h para ${order.customerPhone}`);
      await this.n8nService.dispatchEvent('ORDER_PAYMENT_REMINDER_6H', {
        orderId: order.id,
        phone: order.customerPhone,
        customerName: order.customerName,
        totalValue: order.totalValue,
      });
    }
  }

  async paymentExpired(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Registrando notificação: Pagamento Expirado 22h para ${order.customerPhone}`);
      await this.n8nService.dispatchEvent('ORDER_PAYMENT_EXPIRED_22H', {
        orderId: order.id,
        phone: order.customerPhone,
        customerName: order.customerName,
      });
    }
  }
}
