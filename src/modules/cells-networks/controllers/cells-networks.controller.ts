import { Controller, Get } from '@nestjs/common';

import { ICellNetwork } from '@/common/dtos';
import { CellsNetworksService } from '../services/cell-networks.service';

@Controller('cells-networks')
export class CellsNetworksController {
  constructor(private readonly cellsNetworksService: CellsNetworksService) {
    /* void */
  }

  @Get('count')
  async count(): Promise<{ cells: number }> {
    return await this.cellsNetworksService.count();
  }

  @Get()
  async list(): Promise<ICellNetwork[]> {
    return await this.cellsNetworksService.findAll();
  }
}
