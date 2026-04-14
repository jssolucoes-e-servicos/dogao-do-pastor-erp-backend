import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { PurchasingService } from '../services/purchasing.service';

@Controller('purchasing')
@UseGuards(JwtAuthGuard)
export class PurchasingController {
  constructor(private readonly service: PurchasingService) {}

  @Get()
  list(@Query('editionId') editionId?: string) { return this.service.list(editionId); }

  @Get('report')
  report(@Query('editionId') editionId?: string) { return this.service.consumptionReport(editionId); }

  @Get(':id')
  findById(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  create(@Body() dto: any, @User() user: any) {
    return this.service.create({ ...dto, createdById: user?.id });
  }

  @Patch(':id/delivered')
  markDelivered(@Param('id') id: string) { return this.service.markDelivered(id); }
}
