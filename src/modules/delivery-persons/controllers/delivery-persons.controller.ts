import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { DeliveryPersonEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateDeliveryPersonDto } from 'src/modules/delivery-persons/dto/create-delivery-person.dto';
import { UpdateDeliveryPersonDto } from 'src/modules/delivery-persons/dto/update-delivery-person.dto';
import { DeliveryPersonsService } from 'src/modules/delivery-persons/services/delivery-persons.service';

@Controller('delivery-persons')
export class DeliveryPersonsController {
  constructor(private readonly service: DeliveryPersonsService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<DeliveryPersonEntity>> {
    return this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateDeliveryPersonDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-contributor/:id')
  async findByContributorId(@Param() { id }: IdParamDto) {
    return await this.service.findByContributorId(id);
  }

  @Put(':id')
  async update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateDeliveryPersonDto,
  ) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return await this.service.remove(id);
  }

  @Post('restore/:id')
  async restore(@Param() { id }: IdParamDto) {
    return await this.service.restore(id);
  }
}
