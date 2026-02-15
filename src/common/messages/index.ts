import { Logger } from '@nestjs/common';
import { OrderEntity } from '../entities';
import { MW_DeliveryPersons_RouteAssigned } from './whatsapp/delivery-persons/route-assigned.message';
import { MW_OrderDelivered } from './whatsapp/orders/delivered.message';
import { MW_OrderDeliveryFailed } from './whatsapp/orders/delivery-failed.message';
import { MW_OrderDeliverySkiped } from './whatsapp/orders/delivery-skiped.message';
import { MW_OrderNewSite } from './whatsapp/orders/new-site.message';
import { MW_OrderNextDelivery } from './whatsapp/orders/next-delivery.message';
import { MW_OrderPaymentPending24h } from './whatsapp/orders/payment-pending-24h.message';
import { MW_OrderRecoveryAbandoned } from './whatsapp/orders/recovery-abandoned.message';
import { MW_OrderSendAnalisys } from './whatsapp/orders/send-analisys.message';
import { MW_PartnerWellcomePortal } from './whatsapp/partners/wellcome-portal.message';

const validateContact = (order: OrderEntity): boolean => {
  if (!order.customer.phone) {
    Logger.warn(
      `Cliente ${order.customer.name} sem telefone — pedido ${order.id}`,
    );
    return false;
  }
  return true;
};

export {
  MW_DeliveryPersons_RouteAssigned, MW_OrderDelivered,
  MW_OrderDeliveryFailed,
  MW_OrderDeliverySkiped, MW_OrderNewSite, MW_OrderNextDelivery, MW_OrderPaymentPending24h, MW_OrderRecoveryAbandoned,
  MW_OrderSendAnalisys, MW_PartnerWellcomePortal, validateContact
};

