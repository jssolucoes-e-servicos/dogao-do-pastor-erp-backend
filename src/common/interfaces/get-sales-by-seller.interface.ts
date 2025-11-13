export interface IGetSaleBySeller {
  sellerName: string;
  sales: { customerName: string; quantity: number }[];
  totalDogs: number;
}
