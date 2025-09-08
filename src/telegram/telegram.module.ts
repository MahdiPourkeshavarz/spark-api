/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PostsModule } from 'src/posts/posts.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PostsModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('TELEGRAM_API_KEY'),
      }),
    }),
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
