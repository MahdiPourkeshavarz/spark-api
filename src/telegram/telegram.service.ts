/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  // use channel ID instead of username
  private readonly channelId = -1003057103037;

  constructor(
    private readonly postsService: PostsService,
    @Inject(TELEGRAM_BOT_PROVIDER) private readonly bot: Telegraf<Context>,
  ) {}

  onModuleInit() {
    if ((this.bot as any).polling?.started) {
      this.logger.log('Bot is already running. Skipping launch.');
      return;
    }

    this.logger.log('Setting up listeners for channel_post and message...');

    this.bot.on('channel_post', (ctx) => {
      this.logger.log('--- RAW CHANNEL POST RECEIVED ---');
      console.log(JSON.stringify(ctx.update, null, 2));
      this.handleTextMessage(ctx);
    });

    this.bot.on('message', (ctx) => {
      this.logger.log('--- RAW MESSAGE RECEIVED ---');
      console.log(JSON.stringify(ctx.update, null, 2));
      this.handleTextMessage(ctx);
    });

    this.bot.launch();
    this.logger.log('Telegram bot started and listening.');
  }

  private async handleTextMessage(ctx: Context) {
    const message = (ctx.channelPost || ctx.message) as Message.TextMessage &
      Message.PhotoMessage;
    const chat = message?.chat;
    if (!message || !chat || chat.id !== this.channelId) return;

    if ('forward_from' in message || 'forward_from_chat' in message) {
      this.logger.log('Processing forwarded message...');
      await this.handleForwardedMessage(message);
      return;
    }

    await this.parseAndSavePost(message);
  }

  private async handleForwardedMessage(
    message: Message.TextMessage & Message.PhotoMessage,
  ) {
    const messageText = message.text || message.caption || '';
    if (!messageText) {
      this.logger.warn('Forwarded message has no text content. Skipping.');
      return;
    }

    let lines = messageText
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      this.logger.warn(
        'Forwarded message has less than 2 lines. Cannot parse author. Skipping.',
      );
      return;
    }

    const potentialChannelId = lines[lines.length - 1].trim();
    if (potentialChannelId.startsWith('@')) {
      lines.pop();
    }

    if (lines.length < 2) {
      this.logger.warn(
        'Forwarded message content is invalid after removing channel ID. Skipping.',
      );
      return;
    }

    let imageUrl: string | undefined = undefined;
    if (message.photo) {
      try {
        const largestPhoto = message.photo[message.photo.length - 1];
        const fileLink = await this.bot.telegram.getFileLink(
          largestPhoto.file_id,
        );
        imageUrl = fileLink.href;
      } catch (error) {
        this.logger.error(
          'Failed to get photo link for forwarded message',
          error,
        );
      }
    }

    const authorLine = lines[lines.length - 1].trim();
    let author: string | null = null;

    const authorPatterns = [
      /\*(.*?)\*/, // For *Author*
      /•(.*?)•/, // For •Author•
      /》(.*?)《/, // For 》Author《
      /»(.*?)«/, // For »Author«
      /×(.*?)×/, //for ×Author×
    ];

    for (const pattern of authorPatterns) {
      const match = authorLine.match(pattern);
      if (match && match[1]) {
        author = match[1].trim();
        break;
      }
    }

    if (!author) {
      author = 'telegram';
    }

    const text = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    const lang = this.isFarsi(text) ? 'fa' : 'en';

    if (!text || text.length > 310) {
      this.logger.warn(`Forwarded post is invalid or too long. Skipping.`);
      return;
    }

    this.logger.log(
      `VALID FORWARDED POST | Lang: ${lang} | Author: ${author} | Text: ${text.substring(0, 40)}...`,
    );

    this.postsService.createFromTelegram({
      text,
      author,
      lang,
      source: 'telegram',
      imageUrl,
    });
  }

  private isFarsi(text: string): boolean {
    const farsiRegex = /[\u0600-\u06FF]/;
    return farsiRegex.test(text);
  }

  private async parseAndSavePost(
    message: Message.TextMessage & Message.PhotoMessage,
  ) {
    const messageText = message.text || message.caption || '';
    if (!messageText) return;

    let imageUrl: string | undefined = undefined;
    if (message.photo) {
      try {
        const largestPhoto = message.photo[message.photo.length - 1];
        const fileLink = await this.bot.telegram.getFileLink(
          largestPhoto.file_id,
        );
        imageUrl = fileLink.href;
      } catch (error) {
        this.logger.error('Failed to get photo link for direct message', error);
      }
    }

    let lines = messageText
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');
    if (lines.length < 2) return;

    const potentialChannelId = lines[lines.length - 1].trim();
    if (potentialChannelId === '@jaragheApi') {
      lines.pop();
    }
    if (lines.length < 2) return;

    const authorLine = lines[lines.length - 1].trim();
    let author: string | null = null;
    if (
      authorLine.length >= 3 &&
      authorLine.charAt(0) === authorLine.charAt(authorLine.length - 1)
    ) {
      author = authorLine.slice(1, -1).trim();
    }
    if (!author) return;

    const text = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    const lang = this.isFarsi(text) ? 'fa' : 'en';
    if (!text || text.length > 310) return;

    this.logger.log(`VALID POST | Image: ${!!imageUrl} | Author: ${author}`);
    this.postsService.createFromTelegram({ text, author, lang, imageUrl });
  }
}
