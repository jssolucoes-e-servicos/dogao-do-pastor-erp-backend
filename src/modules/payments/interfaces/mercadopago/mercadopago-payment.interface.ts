import { PaymentStatusEnum } from 'src/common/enums';
import { IMPPix } from '../payment.interface';

export interface IMPPayment {
  id: string;
  status: PaymentStatusEnum;
  detail: string;
  pix?: IMPPix;
}
