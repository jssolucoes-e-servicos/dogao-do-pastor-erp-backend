// src/common/interfaces/index.ts
import {
  IPaginatedResponse,
  IPaginationMeta,
} from 'src/common/interfaces/elementals/paginated-response.interface';
import { IConfig } from './elementals/config.interface';
import { IEvolutionApiSendResponse } from './elementals/evolution-api-send-response.interface';
import { IGender } from './elementals/gender.interface';
import { IGenericUploadResult } from './elementals/generic-upload-result.interface';
import { IWeekDay } from './elementals/weekday.interface';
import { IIsWhatsappResponse } from './is-whatsapp-response.interface';
import { IMPPayment } from './mercadopago/mercadopago-payment.interface';
import { IMercadopagoPix } from './mercadopago/mercadopago-pix.interface';
import { IMercadoPagoWebhookNotification } from './mercadopago/mercadopago-webhook-notifocation.interface';
import { IMercadoPagoPaymentResponse } from './mercadopago/mercadopago.interface';
import {
  IMPCheckout,
  IMPPix,
  IPaymentPayer,
  IPaymentRequest,
  IPaymentResponse,
} from './mercadopago/payment.interface';

export type {
  IConfig,
  IEvolutionApiSendResponse,
  IGender, IGenericUploadResult,
  IIsWhatsappResponse, IMercadoPagoPaymentResponse, IMercadopagoPix,
  IMercadoPagoWebhookNotification, IMPCheckout, IMPPayment, IMPPix, IPaginatedResponse,
  IPaginationMeta, IPaymentPayer,
  IPaymentRequest, IPaymentResponse, IWeekDay
};

