// src/config/config.interface.ts

export interface IConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Segurança
  JWT_SECRET: string;

  // Database
  DATABASE_URL: string;

  // E-mail
  MAILER_HOST: string;
  MAILER_PORT: string;
  MAILER_USER: string;
  MAILER_PASS: string;
  MAILER_FROM: string;

  // Frontend
  NEXTJS_FRONTEND_URL: string;

  //Minio Bucket
  MINIO_HOST_EXTERNAL: string;
  MINIO_ENDPOINT: string;
  MINIO_PORT?: number | undefined | null;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET_NAME: string;
}
