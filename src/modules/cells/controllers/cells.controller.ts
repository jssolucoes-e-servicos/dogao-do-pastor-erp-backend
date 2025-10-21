import { Controller, Get } from '@nestjs/common';
import { CellsRetrieveDto } from '../dto/cells.retrieve.dto';
import { CellsService } from '../services/cell.service';

@Controller('cells')
export class CellsController {
  constructor(private readonly cellsService: CellsService) {
    /* void */
  }

  @Get('count')
  async count(): Promise<{ cells: number }> {
    return await this.cellsService.count();
  }

  @Get()
  async list(): Promise<CellsRetrieveDto[]> {
    return await this.cellsService.findAll();
  }
}
