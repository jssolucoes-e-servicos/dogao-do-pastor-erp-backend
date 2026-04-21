import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardStatsEntity } from 'src/common/entities';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Líder de Célula', 'Supervisor de Rede', 'Vendedor')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Query('editionId') editionId?: string): Promise<DashboardStatsEntity> {
    return this.dashboardService.getSummary(editionId);
  }

  /** Resumo personalizado para o usuário logado (dados da célula/seller) */
  @Get('my-summary')
  async getMySummary(
    @User() user: any,
    @Query('editionId') editionId?: string,
  ) {
    return this.dashboardService.getMySummary(user, editionId);
  }
}
