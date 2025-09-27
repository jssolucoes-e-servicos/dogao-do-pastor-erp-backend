export interface IMPOrder {
  id: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}
