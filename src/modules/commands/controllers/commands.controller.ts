import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CommandStatusEnum, DeliveryOptionEnum } from '@/common/enums';
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
    enum: ['delivery', 'pickup', 'scheduled', 'donate'],
    description:
      'Filtra o tipo da comanda (Entregas, Retiradas, Doações ou Programadas)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CommandStatusEnum,
    description: 'Filtra por status da comanda',
  })
  async listCommands(
    @Query('type') type?: DeliveryOptionEnum,
    @Query('status') status?: CommandStatusEnum,
  ) {
    return this.service.listCommands(type, status);
  }
  @Post('manual')
  async manualInsert(@Body() body) {
    return await this.service.insertManual(body);
  }

  // Atualiza status de comanda para IN_PRODUCTION
  @Patch(':id/start-production')
  async startProduction(@Param('id') id: string) {
    return await this.service.startProduction(id);
  }

  // Atualiza status para PRODUCED
  @Patch(':id/finish-production')
  async finishProduction(@Param('id') id: string) {
    return await this.service.finishProduction(id);
  }

  // Atualiza para EXPEDITION
  @Patch(':id/to-expedition')
  async toExpedition(@Param('id') id: string) {
    return await this.service.markExpedition(id);
  }

  // Marca como entregue
  @Patch(':id/delivered')
  async delivered(@Param('id') id: string) {
    return await this.service.markAsDelivered(id);
  }

  // Lista pendentes agrupados (fila de produção por slot)
  @Get('pending')
  async listPending() {
    return await this.service.listPendingCommands(true);
  }
}
