// src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // BASIC SETTINGS
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  PORT: Joi.number().default(3001),

  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .description('URL de conexão com o Postgres'),
  
  // SECURITY
  JWT_SECRET: Joi.string().required().description('Chave secreta para JWT'),


  // ERROR TRACKING
  SENTRY_DSN: Joi.string().uri().required().description('DSN do Sentry'),

  // MESSAGING / DISCORD
  DISCORD_BOT_TOKEN: Joi.string().required(),
  DISCORD_ERROR_CHANNEL_ID: Joi.string().required(),
  DISCORD_LOG_CHANNEL_ID: Joi.string().required(),
  DISCORD_REPORT_CHANNEL_ID: Joi.string().required(),
  ERROR_DISCORD_MIN_SEVERITY: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .default('medium'),

  // EMAIL SERVICE
  MAILER_HOST: Joi.string().hostname().required(),
  MAILER_PORT: Joi.string().required(),
  MAILER_USER: Joi.string().required(),
  MAILER_PASS: Joi.string().required(),
  MAILER_FROM: Joi.string().required(),

  // MINIO / S3
  MINIO_HOST_EXTERNAL: Joi.string()
    .required()
    .description('Hostname público (DNS) do MinIO'),
  MINIO_ENDPOINT: Joi.string().hostname().required(),
  MINIO_PORT: Joi.number().optional(),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_BUCKET_NAME: Joi.string().default('dogao-do-pastor-documents'), // Bucket padrão
  // PAYMENTS / MERCADO PAGO
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().required(),
  MERCADOPAGO_SECRET_KEY: Joi.string().required(),
  // WHATSWAPP
  EVOLUTION_API_URL: Joi.string().uri().required(),
  EVOLUTION_API_TOKEN: Joi.string().required(),
  EVOLUTION_API_INSTANCE: Joi.string().required(),

  //FRONTENDS
  FRONTEND_PORTALS_URL: Joi.string().uri().required(),
  FRONTEND_ERP_URL: Joi.string().uri().required(),
});
