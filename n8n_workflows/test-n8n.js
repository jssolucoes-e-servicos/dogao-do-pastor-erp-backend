const testWebhookUrl = 'https://main-n8n.qgymrf.easypanel.host/webhook-test/10fa09d8-dcab-4f2e-9acf-58ac8c120c77';
// Exemplo: 'https://n8n.seusite.com/webhook-test/1234...'

if (testWebhookUrl.includes('<INSIRA_A_SUA_URL_AQUI>')) {
  console.log("❌ Você esqueceu de colocar a URL de teste no topo do arquivo!");
  process.exit(1);
}

fetch(testWebhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Event-Type': 'ORDER_PAYMENT_RECEIVED',
  },
  body: JSON.stringify({
    event: 'ORDER_PAYMENT_RECEIVED',
    timestamp: new Date().toISOString(),
    data: {
      orderId: "PEDIDO-TESTE-999",
      phone: "5511999999999",
      message: "Seu pagamento via PIX no valor de R$ 35.00 foi aprovado. Teste N8N!",
      paymentType: "PIX",
      totalValue: 35.00
    }
  }),
})
  .then((res) => {
    if (res.ok) {
      console.log('✅ Evento enviado com sucesso para o N8N!');
      console.log('Volte lá no painel do N8N. O nó de Webhook deve ter capturado os dados.');
    } else {
      console.log(`❌ Erro do N8N: Status ${res.status}`);
    }
  })
  .catch((err) => console.error('❌ Falha na comunicação de rede com o N8N:', err.message));
