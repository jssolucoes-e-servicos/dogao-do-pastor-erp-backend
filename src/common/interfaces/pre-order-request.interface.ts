import {
  ICustomerData,
  IDeliveryAddress,
  IPreOrderItem,
} from 'src/common/interfaces';

export interface IPreOrderRequest {
  customerData: ICustomerData;
  orderItems: IPreOrderItem[];
  deliveryAddress: IDeliveryAddress;
  cpf: string;
}
