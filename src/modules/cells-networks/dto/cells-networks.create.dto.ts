import { StringValidator } from '@/common/validators';

export class CellsNetworksCreateDTO {
  @StringValidator({ fieldName: 'name', label: 'Nome' })
  name: string;

  @StringValidator({ fieldName: 'supervisorName', label: 'Nome do Supervisor' })
  supervisorName: string;
}
