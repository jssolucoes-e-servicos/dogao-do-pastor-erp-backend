// src/types/auth.d.ts

import { Request } from 'express';

// 1. Payload do JWT
export interface JwtUserPayload {
  userId: string;
  tenantId: string;
  email: string;
}

// 2. Interface da Requisição Customizada (substitui o Express.Request)
export interface CustomRequest extends Request {
  user?: JwtUserPayload; // O campo 'user' tipado
}
