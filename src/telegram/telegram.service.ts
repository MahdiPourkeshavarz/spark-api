/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { TELEGRAM_BOT_PROVIDER } from './constants/bot-provider';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly channelUsername = 'OfficialPersiaTwiter';

  constructor(
    private readonly postsService: PostsService,
    @Inject(TELEGRAM_BOT_PROVIDER) private readonly bot: Telegraf<Context>,
  ) {}

  onModuleInit() {
    if ((this.bot as any).polling?.started) {
      this.logger.log('Bot is already running. Skipping launch.');
      return;
    }

    this.logger.log('Setting up Telegram bot listeners and launching...');
    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
    this.bot.launch();
    this.logger.log('Telegram bot started.');
  }

  private async handleTextMessage(ctx: Context) {
    if (!ctx.message || !ctx.chat) return;
    const message = ctx.message as Message.TextMessage;
    const chat = ctx.chat;
    if ('username' in chat && chat.username === this.channelUsername) {
      this.parseAndSavePost(message.text);
    }
  }

  private isFarsi(text: string): boolean {
    const farsiRegex = /[\u0600-\u06FF]/;
    return farsiRegex.test(text);
  }

  private parseAndSavePost(messageText: string) {
    if (!messageText) return;

    let lines = messageText
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');

    if (lines.length < 2) return;

    const potentialChannelId = lines[lines.length - 1].trim();
    if (potentialChannelId === '@' + this.channelUsername) {
      lines.pop();
    }

    if (lines.length < 2) return;

    const authorLine = lines[lines.length - 1];
    const authorMatch = authorLine.match(/\*(.*?)\*/);
    const author = authorMatch ? authorMatch[1].trim() : null;

    if (!author) return;

    const text = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    const lang = this.isFarsi(text) ? 'fa' : 'en';

    if (!text || text.length > 310) return;

    this.postsService.createFromTelegram({ text, author, lang });
  }
}
