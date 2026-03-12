import { Logger } from '@nestjs/common';
import { OrderEntity } from '../entities';
import { MW_DeliveryPersons_RouteAssigned } from './whatsapp/delivery-persons/route-assigned.message';
import { MW_OrderCardGenerated } from './whatsapp/orders/card-generated.message';
import { MW_OrderDelivered } from './whatsapp/orders/delivered.message';
import { MW_OrderDeliveryFailed } from './whatsapp/orders/delivery-failed.message';
import { MW_OrderDeliverySkiped } from './whatsapp/orders/delivery-skiped.message';
import { MW_OrderNewSite } from './whatsapp/orders/new-site.message';
import { MW_OrderNextDelivery } from './whatsapp/orders/next-delivery.message';
import { MW_OrderPaymentExpired22h } from './whatsapp/orders/payment-expired-22h.message';
import { MW_OrderPaymentPending24h } from './whatsapp/orders/payment-pending-24h.message';
import { MW_OrderPaymentReceive } from './whatsapp/orders/payment-receive.message';
import { MW_OrderPaymentReminder6h } from './whatsapp/orders/payment-reminder-6h.message';
import { MW_OrderPixGenerated } from './whatsapp/orders/pix-generated.message';
import { MW_OrderRecoveryAbandoned } from './whatsapp/orders/recovery-abandoned.message';
import { MW_OrderResponseAnalisys } from './whatsapp/orders/response-analisys.message';
import { MW_OrderSendAnalisys } from './whatsapp/orders/send-analisys.message';
import { MW_PartnerWellcomePortal } from './whatsapp/partners/wellcome-portal.message';
import { MW_CellDailyReport } from './whatsapp/reports/cell-daily-report.message';
import { MW_NetworkDailyReport } from './whatsapp/reports/network-daily-report.message';
import { MW_GlobalRankingReport } from './whatsapp/reports/global-ranking.message';
import { MW_SellerDailyReport } from './whatsapp/reports/seller-daily-report.message';

const validateContact = (order: Partial<OrderEntity>): boolean => {
  if (!order.customer?.phone) {
    Logger.warn(
      `Cliente ${order.customer?.name} sem telefone — pedido ${order.id}`,
    );
    return false;
  }
  return true;
};

export {
  MW_CellDailyReport, MW_NetworkDailyReport, MW_DeliveryPersons_RouteAssigned, MW_GlobalRankingReport, MW_OrderCardGenerated, MW_OrderDelivered, MW_OrderDeliveryFailed, MW_OrderDeliverySkiped, MW_OrderNewSite, MW_OrderNextDelivery, MW_OrderPaymentExpired22h, MW_OrderPaymentPending24h, MW_OrderPaymentReceive, MW_OrderPaymentReminder6h, MW_OrderPixGenerated, MW_OrderRecoveryAbandoned, MW_OrderResponseAnalisys, MW_OrderSendAnalisys, MW_PartnerWellcomePortal, MW_SellerDailyReport, validateContact
};

