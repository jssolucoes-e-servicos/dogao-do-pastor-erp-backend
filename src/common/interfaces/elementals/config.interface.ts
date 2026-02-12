// src/commmon/interfaces/elementals/config.interface.ts

/**
 * interface de configurações
 * @interface IConfig
 */
export interface IConfig {
  // BASIC SETTINGS
  NODE_ENV: 'development' | 'production';
  PORT: number;
  DATABASE_URL: string;
  MONGO_DATABASE_URL: string;
  // SECURITY
  JWT_SECRET: string;
  // ERROR TRACKING
  SENTRY_DSN: string;
  // MESSAGING / DISCORD
  DISCORD_BOT_TOKEN: string;
  DISCORD_ERROR_CHANNEL_ID: string;
  DISCORD_LOG_CHANNEL_ID: string;
  DISCORD_REPORT_CHANNEL_ID: string;
  ERROR_DISCORD_MIN_SEVERITY: string;
  // EMAIL SERVICE
  MAILER_HOST: string;
  MAILER_PORT: string;
  MAILER_USER: string;
  MAILER_PASS: string;
  MAILER_FROM: string;
  // MINIO / S3
  MINIO_HOST_EXTERNAL: string;
  MINIO_ENDPOINT: string;
  MINIO_PORT?: number;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET_NAME: string;
  // PAYMENTS / MERCADO PAGO
  MERCADOPAGO_ACCESS_TOKEN: string;
  MERCADOPAGO_SECRET_KEY: string;
  // WHATSWAPP
  EVOLUTION_API_URL: string;
  EVOLUTION_API_TOKEN: string;
  EVOLUTION_API_INSTANCE: string;
  //FRONTENDS
  FRONTEND_PORTALS_URL: string;
  FRONTEND_ERP_URL: string;
}
