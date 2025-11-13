import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  /* @Get('reset-all')
  async resetAllPasswords() {
    return this.authService.resetAllPasswords();
  } */

  // Optional: endpoint to create user (dev only) - remove or protect in prod
  // @Post('register')
  // async register(@Body() body: RegisterDto) {
  //   return this.authService.register(body);
  // }
}
