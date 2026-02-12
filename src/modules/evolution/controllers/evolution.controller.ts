import { Body, Controller, Post } from '@nestjs/common';
import { CheckNumberDTO } from '../dto/check-number.dto';
import { EvolutionService } from '../services/evolution.service';

@Controller('whatsapp')
export class EvolutionController {
  constructor(private readonly service: EvolutionService) {
    /* void */
  }

  @Post('check-number')
  async checkWhatsAppNumber(@Body() body: CheckNumberDTO) {
    return await this.service.checkWhatsAppNumber(body.phone);
  }
}
