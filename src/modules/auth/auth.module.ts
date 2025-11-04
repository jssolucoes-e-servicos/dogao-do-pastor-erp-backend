import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/services/prisma.service';
import { AuthController } from './controllers/auth.controller';
import { UserJwtStrategy } from './estrategies/user.jwt.strategy';
import { AuthUserService } from './services/auth-user.service';
import { UserService } from './services/user.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [UserService, AuthUserService, UserJwtStrategy, PrismaService],
})
export class AuthModule {
  /* void */
}
