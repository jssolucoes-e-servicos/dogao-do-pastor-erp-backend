// src/modules/discord/discord.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NecordModule } from 'necord';
import { DiscordService } from 'src/modules/discord/services/discord.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('DISCORD_BOT_TOKEN');
        if (!token) {
          throw new Error('DISCORD_BOT_TOKEN is not defined');
        }

        return {
          token,
          intents: ['Guilds', 'GuildMessages'],
        };
      },
    }),
  ],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {
  /* void */
}
