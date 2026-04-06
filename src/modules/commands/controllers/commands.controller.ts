import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/helpers/importer.helper';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { CommandEntity } from 'src/common/entities';
import { CreateManualCommandDto } from '../dto/create-manual-command.dto';
import { UpdateCommandDto } from '../dto/update-command.dto';
import { CheckInCommandDto } from '../dto/check-in-command.dto';
import { CommandsService } from '../services/commands.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CommandsBatchService } from '../services/commands-batch.service';

@Controller('commands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('IT', 'ADMIN', 'FINANCE', 'RECEPTION', 'EXPEDITION')
export class CommandsController {
  constructor(
    private readonly service: CommandsService,
    private readonly batchService: CommandsBatchService,
  ) {}

  // ── Rotas públicas (print-app) — sem JWT ─────────────────────────────────

  @Get('pending-print')
  @Public()
  @ApiOperation({ summary: 'Busca comandas que ainda não foram impressas' })
  async getPendingPrint(): Promise<CommandEntity[]> {
    return this.service.getPendingPrint();
  }

  @Patch(':id/mark-printed')
  @Public()
  @ApiOperation({ summary: 'Marca uma comanda como impressa e muda status para IN_PRODUCTION' })
  async markAsPrinted(@Param() { id }: IdParamDto): Promise<CommandEntity> {
    const dto = new UpdateCommandDto();
    dto.printed = true;
    dto.status = 'IN_PRODUCTION' as any;
    return this.service.update(id, dto);
  }

  // ── Rotas autenticadas ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lista comandas da edição ativa' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma comanda por ID' })
  async findOne(@Param() { id }: IdParamDto): Promise<CommandEntity> {
    return this.service.findById(id, {
      include: {
        order: { include: { customer: true, address: true, items: true } },
        withdrawal: { include: { partner: true, items: true } },
      },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza status ou dados da comanda' })
  async update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateCommandDto,
  ): Promise<CommandEntity> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma comanda (soft delete)' })
  async remove(@Param() { id }: IdParamDto): Promise<CommandEntity> {
    return this.service.remove(id);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Cria uma comanda manualmente' })
  async createManual(
    @Body() dto: CreateManualCommandDto,
  ): Promise<CommandEntity> {
    return this.service.createManual(dto);
  }

  @Post('check-in/:id')
  @ApiOperation({ summary: 'Envia um pedido pago para a produção (Check-in)' })
  async checkIn(
    @Param() { id }: IdParamDto,
    @Body() dto?: CheckInCommandDto,
  ): Promise<CommandEntity> {
    return this.service.checkIn(id, dto);
  }

  @Get('batch/summary')
  @ApiOperation({ summary: 'Resumo dos lotes de comandas agendadas (QUEUE)' })
  async getBatchSummary() {
    return this.batchService.getBatchSummary();
  }

  @Post('batch/pull')
  @ApiOperation({ summary: 'Puxar manualmente um lote para produção' })
  async pullBatch(@Body() dto: { hour: number; slot: 'first' | 'second' }) {
    const count = await this.batchService.pullBatch(dto.hour, dto.slot);
    return { pulled: count };
  }

  @Post('batch/pull-all-queue')
  @ApiOperation({ summary: 'Puxar todas as comandas QUEUE para PENDING imediatamente' })
  async pullAllQueue() {
    const result = await this.batchService['prisma'].command.updateMany({
      where: { status: 'QUEUE', active: true },
      data: { status: 'PENDING' },
    });
    return { pulled: result.count };
  }
}
