import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { CashSettlementService } from '../services/cash-settlement.service';

@Controller('cash-settlements')
@UseGuards(JwtAuthGuard)
export class CashSettlementController {
  constructor(private readonly service: CashSettlementService) {}

  /** Meu saldo pendente (vendedor) */
  @Get('me')
  getMyBalance(@User() user: any) {
    return this.service.getMyBalance(user.id);
  }

  /** Informar repasse (vendedor) */
  @Patch(':id/submit')
  submit(
    @Param('id') id: string,
    @User() user: any,
    @Body() dto: { paymentMethod: string; notes?: string },
  ) {
    return this.service.submit(id, user.id, dto);
  }

  /** Confirmar recebimento (tesoureira/financeiro) */
  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @User() user: any) {
    return this.service.confirm(id, user.id);
  }

  /** Todos os acertos (financeiro) */
  @Get()
  listAll(@Query('status') status?: string, @Query('editionId') editionId?: string) {
    return this.service.listAll(status, editionId);
  }

  /** Acertos da célula (líder) */
  @Get('cell/:cellId')
  listByCell(@Param('cellId') cellId: string, @Query('editionId') editionId?: string) {
    return this.service.listByCell(cellId, editionId);
  }
}
