import { Controller } from '@nestjs/common';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Controller('evolution')
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {
    /* void */
  }
}
