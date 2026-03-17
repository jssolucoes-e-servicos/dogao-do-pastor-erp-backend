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
import { CommandsService } from '../services/commands.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('commands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('IT', 'ADMIN', 'FINANCE', 'RECEPTION', 'EXPEDITION')
export class CommandsController {
  constructor(private readonly service: CommandsService) {}

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

  @Get('pending-print')
  @ApiOperation({ summary: 'Busca comandas que ainda não foram impressas' })
  async getPendingPrint(): Promise<CommandEntity[]> {
    return this.service.getPendingPrint();
  }

  @Patch(':id/mark-printed')
  @ApiOperation({ summary: 'Marca uma comanda como impressa' })
  async markAsPrinted(@Param() { id }: IdParamDto): Promise<CommandEntity> {
    const dto = new UpdateCommandDto();
    dto.printed = true;
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
  async checkIn(@Param() { id }: IdParamDto): Promise<CommandEntity> {
    return this.service.checkIn(id);
  }
}
