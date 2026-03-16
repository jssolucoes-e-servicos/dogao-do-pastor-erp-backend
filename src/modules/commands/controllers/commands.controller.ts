import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/helpers/importer.helper';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { UpdateCommandDto } from '../dto/update-command.dto';
import { CommandsService } from '../services/commands.service';

@Controller('commands')
export class CommandsController {
  constructor(private readonly service: CommandsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista comandas da edição ativa' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma comanda por ID' })
  async findOne(@Param() { id }: IdParamDto) {
    return this.service.findById(id, {
      include: {
        order: { include: { customer: true, address: true, items: true } },
        withdrawal: { include: { partner: true, items: true } },
      },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza status ou dados da comanda' })
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateCommandDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma comanda (soft delete)' })
  async remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }
}
