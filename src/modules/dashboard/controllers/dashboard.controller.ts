import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardStatsEntity } from 'src/common/entities'; // Ajuste o path
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Líder de Célula', 'Supervisor de Rede', 'Vendedor')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(): Promise<DashboardStatsEntity> {
    return this.dashboardService.getSummary();
  }
}
