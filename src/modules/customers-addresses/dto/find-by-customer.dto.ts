import { CuidValidator } from 'src/common/validators';

export class FindByCustomerDto {
  @CuidValidator({
    fieldName: 'customerId',
    label: 'ID do Cliente',
  })
  customerId: string;
}
