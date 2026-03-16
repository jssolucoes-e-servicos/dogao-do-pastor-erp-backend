import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { SetupService } from '../services/setup.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('system')
export class SystemController {
  constructor(private readonly setupService: SetupService) {}

  @Public()
  @Post('init-permissions')
  async initPermissions(@Body() body: { secret: string }) {
    // Proteção básica para evitar disparos acidentais ou maliciosos
    // Em produção isso deveria vir de uma variável de ambiente secundária
    if (body.secret !== 'dogao-master-key-2026') {
      throw new UnauthorizedException('Chave secreta de sistema inválida.');
    }

    return this.setupService.runInitialSetup();
  }
}
