import { OrderOnlineFullRetrieveDTO } from './order-online-full-retrieve.dto';

export class OrderOnlineWithCustomerItemsAddressDTO extends OrderOnlineFullRetrieveDTO {
  address: Adress | null;
  preOrderItems: OrderOnlineItem[];
}

class Adress {
  number: string;
  id: string;
  customerId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string | null;
}

class OrderOnlineItem {
  id: string;
  orderOnlineId: string;
  removedIngredients: string[];
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}
