// src/common/configs/mailer.config.ts

import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';
import { ConfigService } from 'src/common/helpers/importer-helper';

export function getMailerConfig(configService: ConfigService): MailerOptions {
  const host = configService.get('MAILER_HOST')!;
  const port = configService.get('MAILER_PORT')!;
  const user = configService.get('MAILER_USER')!;
  const pass = configService.get('MAILER_PASS')!;
  const from = configService.get('MAILER_FROM')!;

  // 🔑 CORREÇÃO: Removemos o fallback condicional. As chaves são obrigatórias em todos os ambientes.
  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      'As configurações de e-mail (MAIL_HOST, MAIL_USER, etc.) são obrigatórias. ' +
      'Configure as credenciais do seu serviço SMTP (ex: Mailtrap) no .env.',
    );
  }

  // 🔑 Configuração do transporte SMTP
  return {
    transport: {
      host: host,
      port: +port,
      secure: +port === 465, // Use true para porta 465 (SSL), false para 587 (TLS/STARTTLS)
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        // Isso é frequentemente necessário para Mailtrap/servidores de teste que não têm certificados perfeitos
        rejectUnauthorized: false,
      },
    },
    defaults: {
      from: `"${configService.get('APP_NAME') || 'smartChurches'}" <${from}>`,
    },
    template: {
      // Configuração do Handlebars
      dir: path.resolve(__dirname, '..', 'mail', 'templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  };
}
