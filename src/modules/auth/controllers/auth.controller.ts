import { Body, Controller, Post } from '@nestjs/common';
import { AuthUserService } from '../services/auth-user.service';
import { UserLoginDto } from '../user-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authUserService: AuthUserService) {
    /* void */
  }

  @Post('login/user')
  async loginUser(@Body() body: UserLoginDto) {
    return this.authUserService.login(body.username, body.password);
  }
}
