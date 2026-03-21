import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const ROLE_ID = 'clz_role_ti_001';

@Controller('admin/fix-roles')
@ApiTags('Admin - Fix Roles')
export class FixRolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Atribui a role IT a todos os contributors que ainda não a possuem' })
  async fixRoles() {
    const contributors = await this.prisma.contributor.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true },
    });

    let added = 0;
    let skipped = 0;

    for (const c of contributors) {
      const exists = await this.prisma.userRole.findFirst({
        where: { contributorId: c.id, roleId: ROLE_ID },
      });

      if (exists) {
        skipped++;
        continue;
      }

      await this.prisma.userRole.create({
        data: { contributorId: c.id, roleId: ROLE_ID },
      });
      added++;
    }

    return {
      message: 'Roles atualizadas com sucesso',
      total: contributors.length,
      added,
      skipped,
    };
  }
}
