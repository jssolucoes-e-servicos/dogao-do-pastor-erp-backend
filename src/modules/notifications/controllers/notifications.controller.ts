import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { NotificationsService } from '../services/notifications.service';
import {
  RegisterTokenDto,
  SendToContributorDto,
  SendToCellDto,
  SendToNetworkDto,
  SendToAllDto,
  UpdatePreferencesDto,
} from '../dto/send-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // ── Token ─────────────────────────────────────────────────────

  @Post('token')
  async registerToken(
    @User() user: any,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.service.registerToken(user.id, dto.token, dto.platform);
  }

  @Delete('token/:token')
  async removeToken(@Param('token') token: string) {
    return this.service.removeToken(token);
  }

  // ── Preferences ───────────────────────────────────────────────

  @Get('preferences')
  async getPreferences(@User() user: any) {
    return this.service.getPreferences(user.id);
  }

  @Put('preferences')
  async updatePreferences(@User() user: any, @Body() dto: UpdatePreferencesDto) {
    return this.service.updatePreferences(user.id, dto);
  }

  // ── Send (admin/manager only) ─────────────────────────────────

  @Post('send/contributor')
  @Roles('T.I', 'ADMINISTRAÇÃO')
  async sendToContributor(@Body() dto: SendToContributorDto) {
    return this.service.sendToContributor(dto);
  }

  @Post('send/cell')
  @Roles('T.I', 'ADMINISTRAÇÃO', 'LÍDER DE CÉLULA', 'SUPERVISOR DE REDE')
  async sendToCell(@Body() dto: SendToCellDto) {
    return this.service.sendToCell(dto);
  }

  @Post('send/network')
  @Roles('T.I', 'ADMINISTRAÇÃO', 'SUPERVISOR DE REDE')
  async sendToNetwork(@Body() dto: SendToNetworkDto) {
    return this.service.sendToNetwork(dto);
  }

  @Post('send/all')
  @Roles('T.I', 'ADMINISTRAÇÃO')
  async sendToAll(@Body() dto: SendToAllDto) {
    return this.service.sendToAll(dto);
  }

  // ── Logs ──────────────────────────────────────────────────────

  @Get('logs')
  @Roles('T.I', 'ADMINISTRAÇÃO')
  async getLogs() {
    return this.service.getLogs();
  }
}
