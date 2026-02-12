
import { Injectable } from '@nestjs/common';
import { OrderEntity } from 'src/common/entities';
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
  MW_OrderRecoveryAbandoned,
  MW_OrderSendAnalisys,
  validateContact,
} from 'src/common/messages';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Injectable()
export class OrdersNotificationsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async delivered(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de falha na entrega para ${order.customer.phone}`,
      );
      const message = MW_OrderDelivered();
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async deliveryFailed(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de falha na entrega para ${order.customer.phone}`,
      );
      const message = MW_OrderDeliveryFailed();
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async deliverySkyped(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de parada na entrega pulada para ${order.customer.phone}`,
      );
      const message = MW_OrderDeliverySkiped();
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async createdNewSite(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(`Enviando aviso de compra para ${order.customer.phone}`);
      const message = MW_OrderNewSite(order);
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async nextDelivery(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de proxima parada para ${order.customer.phone}`,
      );
      const message = MW_OrderNextDelivery(order.customerName);
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async paymentPending24h(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de proxima parada para ${order.customer.phone}`,
      );
      const message = MW_OrderRecoveryAbandoned(order.customerName);
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async recoveryAbandoned(order: OrderEntity) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de proxima parada para ${order.customer.phone}`,
      );
      const message = MW_OrderRecoveryAbandoned(order.customerName);
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }

  async sendAnalisys(
    order: OrderEntity,
    distance: string,
    addressInline: string,
  ) {
    if (validateContact(order)) {
      this.logger.log(
        `Enviando aviso de proxima parada para ${order.customer.phone}`,
      );
      const message = MW_OrderSendAnalisys(order, distance, addressInline);
      await this.evolutionService.sendText(order.customer.phone, message);
    }
  }
}
