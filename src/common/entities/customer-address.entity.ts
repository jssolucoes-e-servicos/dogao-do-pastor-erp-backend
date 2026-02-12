import { CustomerEntity, OrderEntity } from ".";

export class CustomerAddressEntity {
  id: string;
  customer?: CustomerEntity;
  customerId: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  orders?: OrderEntity[];
}
