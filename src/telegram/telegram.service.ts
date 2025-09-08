/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly channelUsername = 'OfficialPersiaTwiter';

  constructor(
    private readonly postsService: PostsService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  onModuleInit() {
    this.logger.log('Setting up Telegram bot listeners...');

    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));

    this.bot.launch();
    this.logger.log('Telegram bot started and is listening for messages.');
  }

  private async handleTextMessage(ctx: Context) {
    if (!ctx.message || !ctx.chat) return;
    const message = ctx.message as Message.TextMessage;
    const chat = ctx.chat;

    if ('username' in chat && chat.username === this.channelUsername) {
      this.logger.log(
        `Received new TEXT message from @${this.channelUsername}`,
      );
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
    if (lines.length < 3) {
      this.logger.warn('Message has less than three lines, cannot parse.', {
        messageText,
      });
      return;
    }

    const potentialChannelId = lines[lines.length - 1].trim();
    if (potentialChannelId === '@' + this.channelUsername) {
      lines.pop();
    } else {
      this.logger.log(
        `Message skipped: Does not end with the expected channel ID.`,
      );
      return;
    }

    const authorLine = lines[lines.length - 1];
    const authorMatch = authorLine.match(/\*(.*?)\*/);
    const author = authorMatch ? authorMatch[1].trim() : null;

    if (!author) {
      this.logger.log(
        `Message skipped: Author not found in the expected format after removing channel ID.`,
      );
      return;
    }

    const text = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    const lang = this.isFarsi(text) ? 'fa' : 'en';

    if (!text || text.length > 325) {
      this.logger.warn(`Parsed post is invalid or too long. Skipping.`);
      return;
    }

    this.logger.log(
      `VALID POST | Lang: ${lang} | Author: ${author} | Text: ${text.substring(0, 40)}...`,
    );

    this.postsService.createFromTelegram({ text, author, lang });
  }
}
