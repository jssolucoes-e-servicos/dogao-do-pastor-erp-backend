import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { EvolutionService } from '@/modules/evolution/services/evolution.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    LoggerService,
    PrismaService,
    ConfigService,
    EvolutionService,
    EvolutionNotificationsService,
  ],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {
  /* void */
}
