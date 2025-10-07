export class OrderOnlineInitRetrieveDTO {
  id: string;
  customerId?: string | null;
  editionId: string;
  quantity: number;
  valueTotal: number;
  paymentStatus: string;
  paymentProvider: string;
  paymentId?: string | null;
  paymentUrl?: string | null;
  customerAddressId?: string | null;
  observations?: string | null;
  deliveryOption: string;
  status: string;
  isPromo: boolean;
  step: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
