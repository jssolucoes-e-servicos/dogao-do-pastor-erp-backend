import { Controller, Get } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {
    /* void */
  }

  @Get('modules')
  async listModules() {
    return this.userService.listModules();
  }
}
