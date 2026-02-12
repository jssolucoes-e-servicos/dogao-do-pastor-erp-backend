//src/common/services/error-notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ErrorNotificationPayloadType,
  ErrorSeverityType,
} from 'src/common/types';
import { DiscordService } from 'src/modules/discord/services/discord.service';

@Injectable()
export class ErrorNotificationService {
  private readonly logger = new Logger(ErrorNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly discordService: DiscordService,
  ) { }

  async notify(payload: ErrorNotificationPayloadType): Promise<void> {
    this.logger.warn(
      `[${payload.severity.toUpperCase()}] ${payload.title} - ${payload.message}`,
    );

    if (payload.context) {
      this.logger.debug(`Error context: ${JSON.stringify(payload.context)}`);
    }

    if (this.shouldSendToDiscord(payload.severity)) {
      await this.sendToDiscord(payload);
    }
  }

  private shouldSendToDiscord(severity: ErrorSeverityType): boolean {
    const minSeverity =
      this.configService.get<ErrorSeverityType>('ERROR_DISCORD_MIN_SEVERITY') ??
      'high';

    const order: ErrorSeverityType[] = ['low', 'medium', 'high', 'critical'];
    return order.indexOf(severity) >= order.indexOf(minSeverity);
  }

  private async sendToDiscord(
    payload: ErrorNotificationPayloadType,
  ): Promise<void> {
    const channelId = this.configService.get<string>(
      'DISCORD_ERROR_CHANNEL_ID',
    );
    if (!channelId) {
      this.logger.debug(
        'DISCORD_ERROR_CHANNEL_ID not set, skipping Discord notification.',
      );
      return;
    }

    const content = this.formatDiscordMessage(payload);
    await this.discordService.sendToChannel(channelId, content);
  }

  private formatDiscordMessage(payload: ErrorNotificationPayloadType): string {
    const contextJson = payload.context ? '``````' : '';

    return [
      `**[${payload.severity.toUpperCase()}] ${payload.title}**`,
      '',
      payload.message,
      '',
      contextJson,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
