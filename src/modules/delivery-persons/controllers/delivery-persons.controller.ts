import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { DeliveryPersonEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateDeliveryPersonDto } from 'src/modules/delivery-persons/dto/create-delivery-person.dto';
import { UpdateDeliveryPersonDto } from 'src/modules/delivery-persons/dto/update-delivery-person.dto';
import { DeliveryPersonsService } from 'src/modules/delivery-persons/services/delivery-persons.service';

@Controller('delivery-persons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryPersonsController {
  constructor(private readonly service: DeliveryPersonsService) {
    /* void */
  }

  @PaginatedQuery()
  @Roles('IT', 'ADMIN', 'FINANCE', 'EXPEDITION')
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: any,
  ): Promise<IPaginatedResponse<DeliveryPersonEntity>> {
    return this.service.list(query, user);
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
