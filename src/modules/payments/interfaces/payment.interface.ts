
export interface IPaymentPayer {
  firstName?: string;
  lastName?: string;
  email?: string;
  identification?: {
    type: string;
    number: string;
  };
}

export interface IPaymentRequest {
  amount: number;
  description: string;
  payer?: IPaymentPayer;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

export interface IMPPix {
  qrCodeBase64: string | null;
  qrCode: string | null;
  ticketUrl: string | null;
}

export interface IMPPayment {
  id: string;
  status: string; //PaymentStatusEnum;
  detail: string;
  pix?: IMPPix;
}

export interface IMPCheckout {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface IPaymentResponse {
  success: boolean;
  payment: IMPPayment;
}
