// src/modules/discord/discord.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { AuthController } from './controllers/auth.controller';
import { AuthOtpService } from './services/auth-otp.service';
import { AuthPartnerService } from './services/auth-partner.service';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
    EvolutionModule,
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    LoggerService,
    AuthService,
    AuthOtpService,
    AuthPartnerService,
    EvolutionService,
  ],
  exports: [AuthService],
})
export class AuthModule {
  /* void */
}
