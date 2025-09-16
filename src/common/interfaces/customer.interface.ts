import { IAddress } from './address.interface';

export interface ICustomer {
  email?: string | null;
  name: string;
  phone: string | null;
  addresses: IAddress[];
}
