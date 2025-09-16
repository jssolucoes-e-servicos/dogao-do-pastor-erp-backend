export interface IAddress {
  id: string;
  customerId: string;
  street: string;
  number: string;
  complement?: string | null | undefined;
  neighborhood: string | null | undefined;
  city: string;
  state: string;
  zipCode?: string | null | undefined;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null | undefined;
}
