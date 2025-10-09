import { Controller, Get } from '@nestjs/common';
import {
  DashboardService,
  IDashboardStats,
} from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {
    /* void */
  }

  @Get()
  async getStats(): Promise<IDashboardStats> {
    return await this.dashboardService.getStats();
  }
}
