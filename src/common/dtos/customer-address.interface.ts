//interfaces/customer-address-full.interface.ts
export interface ICustomerAddress {
  id: string;
  customerId: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string | null | undefined;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}
