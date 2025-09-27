export interface IPreOrder {
  id: string;
  customerId: string;
  editionId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentStatus: string;
  paymentProvider: string;
  paymentId?: string;
  paymentUrl?: string;
}
