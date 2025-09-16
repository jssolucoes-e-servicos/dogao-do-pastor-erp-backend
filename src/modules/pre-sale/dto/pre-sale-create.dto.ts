import { StringValidator } from '@/common/validators';

export class PreSaleCreateDTO {
  customerData: CustomerDataDTO;
  orderItems: PreOrderItemDTO[];
  deliveryAddress: DeliveryAddressDTO;
  @StringValidator({ fieldName: 'cpf', label: 'cpf', minLength: 11 })
  cpf: string;
}

class CustomerDataDTO {
  @StringValidator({ fieldName: 'name', label: 'Nome' })
  name: string;

  @StringValidator({ fieldName: 'email', label: 'Email' })
  email: string;

  @StringValidator({ fieldName: 'phone', label: 'Telefone' })
  phone: string;
}

class PreOrderItemDTO {
  removedIngredients?: string[];
}

class DeliveryAddressDTO {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
}
