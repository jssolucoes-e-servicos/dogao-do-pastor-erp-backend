export interface IMercadoPagoPaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_detail: string;
}
