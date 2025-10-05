import { MongoIdValidator, StringValidator } from '@/common/validators';

export class PreSaleFirstCreateDTO {
  @StringValidator({ fieldName: 'cpf', label: 'CPF do Clinte' })
  cpf: string;

  @MongoIdValidator({
    fieldName: 'sellerId',
    label: 'Id do Vendedor',
  })
  sellerId: string;

  @StringValidator({ fieldName: 'sellerTag', label: 'Tag do vendedor' })
  sellerTag: string;
}
