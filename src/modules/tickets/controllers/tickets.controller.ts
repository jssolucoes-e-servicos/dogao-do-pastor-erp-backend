import { Controller, Get, Query } from '@nestjs/common';
import { TicketsService } from '../services/tickets.service';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import { PrismaService } from 'src/common/helpers/importer.helper';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly service: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('validate')
  async validate(@Query('number') number: string) {
    const edition = await getActiveEdition(this.prisma);
    if (!edition) {
      throw new Error('Nenhuma edição ativa');
    }
    return await this.service.validateTicket(number, edition.id);
  }
}
