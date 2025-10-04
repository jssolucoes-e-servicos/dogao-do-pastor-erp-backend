export enum OrderStatsEnum {
  digitation = 'digitation', // Pedido em digitação no online
  pending_payment = 'pending_payment', // Quando pedido online esta finalizado, mas sem pagamento
  payd = 'payd', // Quando pedido online recebe Pagamento
  new = 'new', // Quando pedido novo (PDV)
  queue = 'queue', // Quando na fila esperando para horario de produção
  production = 'production', // Quando estiver na produção
  expedition = 'expedition', // Quando Termicada produção, estiver no balcão
  delivering = 'delivering', // Quando sai para entrega
  delivered = 'delivered', // Quando com estatus de já entregue
  cancelled = 'cancelled', // Quando cancelado
  rejected = 'rejected', // Quando pedido rejeitado pelo sistema (não pago)
}
