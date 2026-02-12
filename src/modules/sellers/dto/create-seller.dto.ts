// src/modules/sellers/dto/create-seller.dto.ts

import { CuidValidator, StringValidator } from 'src/common/validators';

export class CreateSellerDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
    minLength: 3,
  })
  name: string;

  @CuidValidator({
    fieldName: 'cellId',
    label: 'ID da Célula',
  })
  cellId: string;

  @CuidValidator({
    fieldName: 'contributorId',
    label: 'ID do (a) Colaborador(a)',
  })
  contributorId: string;

  @StringValidator({
    fieldName: 'tag',
    label: 'TAG',
    minLength: 3,
  })
  tag: string;
}
