import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

@Injectable()
export class AuthUserService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {
    /* void */
  }

  async login(username: string, password: string) {
    const user = await this.userService.validateUser(username, password);
    const payload = { sub: user.id, username: user.username, type: 'user' };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
