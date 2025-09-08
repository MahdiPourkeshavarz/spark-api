/* eslint-disable prettier/prettier */
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

  async testParseAndSave() {
    this.logger.log('--- MANUALLY TRIGGERING PARSER ---');

    const sampleMessage = `اینکه از یه جایی به بعد دیگه هیچی خوشحالت نمیکنه و فقط "بدحالی" هات کم و زیاد میشه، خودِ پیریه.

*ارنستو*
@jaragheApi`;

    try {
      this.parseAndSavePost(sampleMessage);
      return {
        status: 'success',
        message: 'Test message processed. Check logs and database.',
      };
    } catch (error) {
      this.logger.error('Manual test failed!', error.stack);
      return {
        status: 'error',
        message: 'Test failed. Check logs for details.',
      };
    }
  }

  private async handleTextMessage(ctx: Context) {
    const message = (ctx.channelPost || ctx.message) as Message.TextMessage;
    const chat = (ctx.channelPost || ctx.message)?.chat;
    if (!message || !chat) return;

    if (chat.id !== this.channelId) return;

    if ('forward_from' in message || 'forward_from_chat' in message) {
      this.logger.log('Processing forwarded message...');
      this.handleForwardedMessage(message);
      return;
    }

    this.parseAndSavePost(message.text);
  }

  private handleForwardedMessage(message: Message.TextMessage) {
    const messageText = message.text || '';
    if (!messageText) {
      this.logger.warn('Forwarded message has no text content. Skipping.');
      return;
    }

    // A forwarded message often contains the original channel ID at the end.
    // We need to parse the text to find the real author.
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

    // The last line of a forwarded post is usually the original channel's ID (e.g., @OfficialPersiaTwiter).
    // We check for this pattern and remove the line if it exists.
    const potentialChannelId = lines[lines.length - 1].trim();
    if (potentialChannelId.startsWith('@')) {
      lines.pop();
    }

    // After removing the channel ID, we check again if there's enough content to parse an author.
    if (lines.length < 2) {
      this.logger.warn(
        'Forwarded message content is invalid after removing channel ID. Skipping.',
      );
      return;
    }

    // Now, we expect the author to be the new last line, using our resilient pattern check.
    const authorLine = lines[lines.length - 1].trim();
    let author: string | null = null;

    if (
      authorLine.length >= 3 &&
      authorLine.charAt(0) === authorLine.charAt(authorLine.length - 1)
    ) {
      author = authorLine.slice(1, -1).trim();
    }

    if (!author) {
      this.logger.warn(
        'Could not detect an author in the expected format from the forwarded message. Skipping.',
      );
      return;
    }

    // The rest of the message is the post's text.
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

    this.postsService.createFromTelegram({ text, author, lang });
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

    if (!author) {
      this.logger.log(`Message skipped: Author line format not recognized.`);
      return;
    }

    const text = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    const lang = this.isFarsi(text) ? 'fa' : 'en';

    if (!text || text.length > 310) {
      this.logger.warn(`Parsed post is invalid or too long. Skipping.`);
      return;
    }

    this.logger.log(
      `VALID POST | Lang: ${lang} | Author: ${author} | Text: ${text.substring(0, 40)}...`,
    );
    this.postsService.createFromTelegram({ text, author, lang });
  }
}
