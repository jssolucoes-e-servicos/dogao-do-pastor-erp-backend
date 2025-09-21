// Define a interface para o corpo da preferência de pagamento.
// A estrutura corresponde exatamente ao que o SDK do Mercado Pago espera.
export interface CreatePreferenceDto {
  items: {
    id: string;
    title: string;
    description?: string;
    picture_url?: string;
    category_id?: string;
    quantity: number;
    currency_id?: string;
    unit_price: number;
  }[];
  payer: {
    name?: string;
    surname?: string;
    email: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    identification?: {
      type?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      // Corrigindo o tipo para que seja uma string, como a biblioteca espera.
      street_number?: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url: string;
  external_reference: string;
}

// Define a interface para a notificação de webhook.
export interface MercadoPagoWebhookNotification {
  id: number;
  live_mode: boolean;
  type: string;
  data: {
    id: string;
  };
  date_created: string;
}
