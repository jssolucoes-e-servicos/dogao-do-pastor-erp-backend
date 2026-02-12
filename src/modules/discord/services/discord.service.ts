// src/modules/discord/services/discord.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, TextChannel } from 'discord.js';
import { createReadStream, existsSync } from 'fs';
import { Context, Once } from 'necord';
import os from 'node:os';
import { basename } from 'path';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly client: Client,
  ) {
    /* void */
  }

  @Once('clientReady')
  public async onClientReady(@Context() [client]: [Client]) {
    this.logger.log(`Discord bot logged in as ${client.user?.tag}`);
    const env = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || 3000;
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    //const publicIp = await publicIpv4().catch(() => 'unknown');
    if (env !== 'development') {
      const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;
      if (logChannelId) {
        const content = [
          `Dogão do Pastor - Backend started in **${env}** on port **${port}**`,
          `Host: \`${hostname}\` (${platform}/${arch})`,
          //`Public IP: ${publicIp}`,
        ].join('\n');

        await this.sendToChannel(logChannelId, content);
      }
    }
  }

  async sendToChannel(channelId: string, content: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel) {
      this.logger.warn(`Discord channel ${channelId} not found.`);
      return;
    }

    if (!channel.isTextBased()) {
      this.logger.warn(`Discord channel ${channelId} is not text-based.`);
      return;
    }

    await (channel as TextChannel).send({ content });
  }

  async log(message: string): Promise<void> {
    const channelId = this.config.get<string>('DISCORD_LOG_CHANNEL_ID');
    if (!channelId) return;
    await this.sendToChannel(channelId, message);
  }

  async report(message: string): Promise<void> {
    const channelId = this.config.get<string>('DISCORD_REPORT_CHANNEL_ID');
    if (!channelId) return;
    await this.sendToChannel(channelId, message);
  }

  async sendBackup(filePath: string): Promise<void> {
    const channelId = this.config.get<string>('DISCORD_REPORT_CHANNEL_ID');

    if (!channelId) {
      this.logger.warn('DISCORD_REPORT_CHANNEL_ID não configurado');
      return;
    }

    if (!existsSync(filePath)) {
      this.logger.error(`Arquivo de backup não encontrado: ${filePath}`);
      return;
    }

    const channel = await this.client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) {
      this.logger.warn(`Canal ${channelId} inválido ou não é text-based`);
      return;
    }

    await (channel as TextChannel).send({
      content: '📦 **Backup automático do banco de dados**',
      files: [
        {
          attachment: createReadStream(filePath),
          name: basename(filePath),
        },
      ],
    });

    this.logger.log(`Backup enviado para o Discord: ${filePath}`);
  }
}
