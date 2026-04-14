import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { StockService } from '../services/stock.service';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly service: StockService) {}

  @Get('products')
  listProducts() { return this.service.listProducts(); }

  @Post('products')
  createProduct(@Body() dto: { name: string; unit: string; description?: string }) {
    return this.service.createProduct(dto);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: { name?: string; unit?: string; description?: string }) {
    return this.service.updateProduct(id, dto);
  }

  @Get('movements')
  listMovements(@Query('editionId') editionId?: string) {
    return this.service.listMovements(editionId);
  }

  @Post('movements')
  addMovement(@Body() dto: any, @User() user: any) {
    return this.service.addMovement({ ...dto, createdById: user?.id });
  }

  @Get('balance')
  getBalance(@Query('editionId') editionId?: string) {
    return this.service.getBalance(editionId);
  }
}
