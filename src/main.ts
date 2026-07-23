// import './instrument';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './modules/app.module';
//teste
async function bootstrap() {
  // Força escrita síncrona de logs no stdout/stderr (evita buffering no Docker/Easypanel)
  const stdout = process.stdout as any;
  const stderr = process.stderr as any;
  if (stdout._handle && typeof stdout._handle.setBlocking === 'function') {
    stdout._handle.setBlocking(true);
  }
  if (stderr._handle && typeof stderr._handle.setBlocking === 'function') {
    stderr._handle.setBlocking(true);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // <--- ISSO É ESSENCIAL
      transformOptions: {
        enableImplicitConversion: true, // <--- AJUDA A CONVERTER TIPOS PRIMITIVOS
      },
    }),
  );

  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());
  app.enableCors({
    /* origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://dogao.igrejavivaemcelulas.com.br',
      'https://igrejavivaemcelulas.com.br',
      'https://pwa.igrejavivaemcelulas.com.br',
      'https://equipe.igrejavivaemcelulas.com.br',
      // aceita qualquer subdomínio de igrejavivaemcelulas.com.br
      /\.igrejavivaemcelulas\.com\.br$/,
    ], */
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('Dogão do Pastor - by smart Foods Tecnology')
    .setDescription(
      'This is a API for Dogão do Pastor - by smart Foods Tecnology',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-system-secret' },
      'SystemSecret',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true, // mantém o token entre reloads
    },
  });

  console.log('--- BACKEND DDP RESTARTED - PORT:', process.env.PORT ?? 3001, '---');
  
  // Se for dev, espera um pouquinho para a porta anterior fechar de verdade
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
