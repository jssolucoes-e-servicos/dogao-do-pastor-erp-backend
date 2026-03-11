//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/interfaces/mercadopago.interface.ts

export interface IMercadoPagoPaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  status_detail: string;
  transaction_amount: number;
  description: string;
  external_reference: string;
  payment_type_id: 'ticket' | 'bank_transfer' | 'credit_card' | 'debit_card';
  payment_method_id: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
  };
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  // Adicione outras propriedades importantes que você precise, conforme a documentação da API
}
