import { IAddress } from '@/common/interfaces';
import { CustomerRetrieve } from './customer-retrieve';

export class CustomerWithAddressRetriveDTO extends CustomerRetrieve {
  addresses: IAddress[];
}
