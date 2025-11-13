export function MessageRouteAssigned(totalStops: number): string {
  const message = `🚚 Uma nova rota foi atribuída para você com ${totalStops} paradas. Inicie a rota no app.`;
  return message;
}
