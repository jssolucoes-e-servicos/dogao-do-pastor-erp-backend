import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const loggerOptions: winston.LoggerOptions = {
  transports: [
    // 1. Saída no Terminal (Formatado com cores estilo NestJS)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('Dogão do Pastor', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // 2. Arquivo de Logs de Erro
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Mantém por 14 dias
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // 3. Arquivo de Logs Gerais (Combinação de tudo: log, warn, error)
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Mantém por 30 dias
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
