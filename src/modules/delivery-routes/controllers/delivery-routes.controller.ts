import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateDeliveryRouteDto } from '../dto/create-delivery-route.dto';
import { DeliveryRoutesService } from '../services/delivery-routes.service';

@ApiTags('Delivery Routes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('delivery-routes')
export class DeliveryRoutesController {
  constructor(private readonly service: DeliveryRoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova rota de entrega' })
  async create(@Body() dto: CreateDeliveryRouteDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as rotas' })
  async list(@Query() query: PaginationQueryDto) {
    return this.service.paginate(query, {
      include: {
        deliveryPerson: { include: { contributor: true } },
        stops: { include: { order: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma rota' })
  async findOne(@Param('id') id: string) {
    return this.service.findById(id, {
      include: {
        deliveryPerson: { include: { contributor: true } },
        stops: { include: { order: { include: { address: true } } } },
      },
    });
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Inicia uma rota de entrega' })
  async start(@Param('id') id: string) {
    return this.service.startRoute(id);
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Finaliza uma rota de entrega' })
  async finish(@Param('id') id: string) {
    return this.service.finishRoute(id);
  }
}
