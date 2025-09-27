// src/common/interfaces/payment-provider.interface.ts

import { CreatePreferenceDto } from './mp-types.interface';

export interface IPaymentProvider {
  createPreference(body: CreatePreferenceDto): Promise<string>;
}
