export enum OrderStatusEnum {
  DIGITATION = 'DIGITATION',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID', // Pagamento aprovado
  QUEUE = 'QUEUE', // Fila aguardando produção
  PRODUCTION = 'PRODUCTION', // Em produção
  EXPEDITION = 'EXPEDITION', // Pronto no balcão
  DELIVERING = 'DELIVERING', // Saiu para entrega
  DELIVERED = 'DELIVERED', // Entregue
  CANCELLED = 'CANCELLED', // Cancelado
  REJECTED = 'REJECTED', // Rejeitado (não pago ou falha)
}
