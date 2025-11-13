import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsOrigns } from './common/configs/cors.config';
import { LoggerService } from './common/helpers/importer-helper';
import { IConfig } from './common/interfaces';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService<IConfig>);
  const loggerService = app.get(LoggerService);
  const port = configService.get('PORT')!;

  app.enableCors({
    origin: corsOrigns, // Permitir o frontend e o ambiente de desenvolvimento local
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dogão do Pastor')
    .setDescription(
      'This API was created to facilitate and concentrate the model of integration and connection of services and devices with the smartChurhes Platform.',
    )
    .setVersion('1.0')
    /* .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Token',
        in: 'header',
      },
      'JWT-auth',
    ) */
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(port);
  loggerService.setWarn(
    'Bootstrap',
    `Server is running on: http://localhost:${port}`,
  );
}
bootstrap();
