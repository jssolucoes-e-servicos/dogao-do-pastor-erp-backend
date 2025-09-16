import { IAddress } from '@/common/interfaces';

export class CustomerWithAddressRetriveDTO {
  id?: string;
  name: string;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  cpf?: string | null | undefined;
  allowsChurch: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  addresses: IAddress[];
}
