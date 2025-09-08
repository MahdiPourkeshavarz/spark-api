/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PostsModule } from 'src/posts/posts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getBot } from './bot';
import { TELEGRAM_BOT_PROVIDER } from './constants/bot-provider';

@Module({
  imports: [PostsModule, ConfigModule],
  providers: [
    TelegramService,
    {
      provide: TELEGRAM_BOT_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.getOrThrow<string>('TELEGRAM_API_KEY');
        return getBot(token);
      },
    },
  ],
})
export class TelegramModule {}
