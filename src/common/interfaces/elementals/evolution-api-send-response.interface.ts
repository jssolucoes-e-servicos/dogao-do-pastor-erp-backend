export interface IEvolutionApiSendResponse {
  key: {
    remoteJid: string;
    id: string;
    fromMe: boolean;
  };
  message?: {
    extendedTextMessage?: {
      text: string;
    };
  };
  status: number;
  messageStatus: string; // Ex: 'SUCCESS'
  instanceName: string;
  // Adicione outras propriedades que a API realmente retorna
}
