// src/config/validation.schema.ts

import * as Joi from 'joi';

// Define o schema de validação para as variáveis de ambiente (process.env)
export const validationSchema = Joi.object({
  // Variáveis de Ambiente Essenciais
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),

  // 🔒 Variáveis de Segurança/Chaves Secretas
  JWT_SECRET: Joi.string().required().description('Chave secreta para JWT'),

  // 💾 Configurações do Banco de Dados
  // Note que no MongoDB a URL inclui usuário/senha/host
  DATABASE_URL: Joi.string()
    .uri() // Garante que é uma URI válida (mongodb://...)
    .required()
    .description('URL de conexão com o MongoDB Atlas'),

  // 📧 Configurações de E-mail
  MAILER_HOST: Joi.string().hostname().required(),
  MAILER_PORT: Joi.string().required(),
  MAILER_USER: Joi.string().required(),
  MAILER_PASS: Joi.string().required(),
  MAILER_FROM: Joi.string().required(),

  // ⚡ Configurações do Next.js (Frontend)
  NEXTJS_FRONTEND_URL: Joi.string()
    .uri()
    .required()
    .description('URL do frontend Next.js para CORS'),

  // 💾 Configurações do MinIO
  MINIO_HOST_EXTERNAL: Joi.string()
    .required()
    .description('Hostname público (DNS) do MinIO'),
  MINIO_ENDPOINT: Joi.string().hostname().required(),
  MINIO_PORT: Joi.number().optional(),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_BUCKET_NAME: Joi.string().default('dogao-do-pastor-documents'), // Bucket padrão
});
