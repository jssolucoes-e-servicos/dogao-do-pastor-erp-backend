/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
// src/common/interfaces/mercadopago-webhook.interface.ts
export interface IMercadoPagoWebhookNotification {
  id?: string;
  live_mode?: boolean;
  type?: 'payment' | 'plan' | 'subscription' | 'invoice' | 'test' | string;
  date_created?: string;
  user_id?: string;
  api_version?: string;
  action?: string;
  data?: {
    id: string;
  };
}
