export class SellerRetrieveDTO {
  id: string;
  cellId?: string | null;
  name: string;
  phone: string;
  tag: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SellerRetrieveWithCellDTO extends SellerRetrieveDTO {
  cell: {
    id: string;
    name: string;
    networkName: string;
    leaderName: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } | null;
}
