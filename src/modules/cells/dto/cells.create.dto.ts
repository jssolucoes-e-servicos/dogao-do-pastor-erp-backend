import { MongoIdValidator, StringValidator } from '@/common/validators';

export class CellsCreateDTO {
  @StringValidator({ fieldName: 'name', label: 'Nome' })
  name: string;

  @MongoIdValidator({ fieldName: 'networkId', label: 'ID da Rede' })
  networkId: string;

  @StringValidator({ fieldName: 'leaderName', label: 'Nome do Líder' })
  leaderName: string;
}
