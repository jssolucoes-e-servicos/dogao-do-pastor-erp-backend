import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { validationSchema } from 'src/common/configs/validation.schema';
import { HttpThrottlerGuard } from 'src/common/guards/http-throttler.guard';
import { AdminsModule } from 'src/modules/admins/admins.module';
import { DiscordModule } from 'src/modules/discord/discord.module';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { LoggerModule } from 'src/modules/logger/logger.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { ErrorNotificationService } from './services/error-notification.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      // ignoreEnvFile: true // Usar em produção se as variáveis vierem diretamente do ambiente (Kubernetes/Vercel)
    }),
    CacheModule.register(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000, // Janela de 10 segundos (mais curta é melhor)
          limit: 50, // 50 requisições a cada 10 segundos
        },
      ],
    }),
    SentryModule.forRoot(),
    LoggerModule,
    PrismaModule,
    EvolutionModule,
    DiscordModule,
    AdminsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
    ErrorNotificationService,
  ],
  exports: [ErrorNotificationService],
})
export class CommonModule {
  /* void */
}
