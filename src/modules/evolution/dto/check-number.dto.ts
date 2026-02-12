import { StringValidator } from "src/common/validators";

export class CheckNumberDTO {
  @StringValidator({
    fieldName: 'phone',
    label: 'Telefone para verificação',
    minLength: 11,
  })
  phone: string;
}
