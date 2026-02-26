/* export enum OrderStatusEnum {
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
 */

export const OrderStatusEnum = {
  DIGITATION: 'DIGITATION',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  QUEUE: 'QUEUE',
  PRODUCTION: 'PRODUCTION',
  EXPEDITION: 'EXPEDITION',
  DELIVERING: 'DELIVERING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

export type OrderStatusEnum =
  (typeof OrderStatusEnum)[keyof typeof OrderStatusEnum];
