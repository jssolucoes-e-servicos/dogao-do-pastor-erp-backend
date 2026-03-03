import { Controller, Get } from '@nestjs/common';
import { DashboardStatsEntity } from 'src/common/entities'; // Ajuste o path
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
// @UseGuards(ErpAuthGuard) // Ative se quiser proteger a rota
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(): Promise<DashboardStatsEntity> {
    return this.dashboardService.getSummary();
  }
}
