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
import { N8nModule } from 'src/modules/n8n/n8n.module';
import { AuthController } from './controllers/auth.controller';
import { AuthOtpService } from './services/auth-otp.service';
import { AuthPartnerService } from './services/auth-partner.service';
import { AuthService } from './services/auth.service';
import { AuthContributorService } from './services/auth-contributor.service';
import { AuthCustomerService } from './services/auth-customer.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AccessLinkGuard } from './guards/access-link.guard';
import { PassportModule } from '@nestjs/passport';

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
    N8nModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    LoggerService,
    AuthService,
    AuthOtpService,
    AuthPartnerService,
    AuthContributorService,
    AuthCustomerService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    AccessLinkGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, AccessLinkGuard],
})
export class AuthModule {
  /* void */
}
