export interface ICustomer {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  cpf: string;
  knowsChurch?: boolean;
  allowsChurch?: boolean;
  firstRegister: boolean;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}
