import { CustomerAddressEntity, OrderEntity, VoucherEntity } from '.';

export class CustomerEntity {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  password: string;
  knowsChurch: boolean;
  allowsChurch: boolean;
  firstRegister: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  vouchers?: VoucherEntity[];
  addresses?: CustomerAddressEntity[];
  orders?: OrderEntity[];
}
