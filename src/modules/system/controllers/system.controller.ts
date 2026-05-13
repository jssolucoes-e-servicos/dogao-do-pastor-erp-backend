import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { SetupService } from '../services/setup.service';
import { GeocodingService } from '../services/geocoding.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('system')
export class SystemController {
  constructor(
    private readonly setupService: SetupService,
    private readonly geocoding: GeocodingService
  ) {}

  @Public()
  @Post('init-permissions')
  async initPermissions(@Body() body: { secret: string }) {
    if (body.secret !== 'dogao-master-key-2026') {
      throw new UnauthorizedException('Chave secreta de sistema inválida.');
    }
    return this.setupService.runInitialSetup();
  }

  @Public()
  @Post('geocode-pending')
  async geocodePending() {
    const count = await this.geocoding.geocodePending();
    return { success: true, count };
  }
}
