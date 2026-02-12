import { Get, Post } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { AdminController } from 'src/common/helpers/importer.helper';

@AdminController('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {
    /* void */
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
  @Post('revalidate/editions')
  async revalidateEdition() {
    await fetch(
      `${process.env.FRONTEND_PORTALS_URL}/api/revalidate?tag=active-edition&secret=${process.env.REVALIDATION_SECRET}`,
      {
        method: 'POST',
      },
    );
  }
}
