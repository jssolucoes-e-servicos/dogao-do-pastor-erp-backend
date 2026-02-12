// src/types/express-request.d.ts

// Cria um tipo para o objeto 'user' que você injeta via Passport/JWT Guard
export interface JwtUserPayload {
  userId: string;
  tenantId: string;
  email: string;
  // Adicione qualquer outra informação que você injeta no JWT payload
}

// Extende o objeto Request do Express
// Isso "sobrescreve" a definição padrão do Request no módulo 'express'
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload; // O campo 'user' agora é tipado
    }
  }
}
