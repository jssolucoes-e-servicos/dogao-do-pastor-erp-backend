import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { DeliveryOptionEnum } from '@/common/enums';
import { ApiQuery } from '@nestjs/swagger';
import { CommandsService } from '../services/commands.service';

@Controller('commands')
export class CommandsController {
  constructor(private readonly service: CommandsService) {
    /* void */
  }

  @Post('batch-generate')
  async batchGenerateCommands() {
    // Busca todos os pedidos, pode ajustar filtro conforme necessário
    const editionCode = 253;
    // Gera comandas para todos os pedidos (não apenas os delivery, pois você quer salvar todas)
    const created = await this.service.generateAllCommands(editionCode);

    return {
      created: created.length,
      message:
        'Commands generated for all orders. Automatic printing will only occur for delivery orders.',
    };
  }

  // Ver status de uma comanda
  /* @Get('find-code/:sequentialId')
  async getCommand(@Param('sequentialId') sequentialId: string) {
    return this.service.findBySequentialId(sequentialId);
  }
 */
  // Forçar reprocessamento
  @Post('reprint/:id')
  async reprintCommand(@Param('id') id: string) {
    await this.service.markAsUnprinted(id);
    return { message: 'Command queued for reprint' };
  }

  @Get()
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['delivery', 'pickup', 'scheduled'],
    description:
      'Filtra o tipo da comanda (Entregas, Retiradas ou Retirada Programada)',
  })
  async listCommands(@Query('type') type: DeliveryOptionEnum) {
    return this.service.listCommands(type);
  }

  /* @Get('count')
  async count(): Promise<{ cells: number }> {
    return await this.service.count();
  } */

  /* @Get()
  async list(): Promise<ICellNetwork[]> {
    return await this.service.findAll();
  } */
}
