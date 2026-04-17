/**
 * Delay humanizado para envio de WhatsApp em massa.
 * Usa variação aleatória para evitar detecção de spam.
 *
 * Recomendações para não ser bloqueado:
 * - Entre mensagens do mesmo contato: 3-5 segundos
 * - Entre contatos diferentes: 8-15 segundos
 * - A cada 50 mensagens: pausa maior de 30-60 segundos
 */

/** Delay aleatório entre min e max ms */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(r => setTimeout(r, ms));
}

/** Delay entre duas mensagens para o mesmo contato (3-5s) */
export const delayBetweenMessages = () => randomDelay(3000, 5000);

/** Delay entre contatos diferentes (8-15s) */
export const delayBetweenContacts = () => randomDelay(8000, 15000);

/** Pausa maior a cada N contatos para evitar bloqueio (30-60s) */
export const delayBigPause = () => randomDelay(30000, 60000);
