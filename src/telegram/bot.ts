/* eslint-disable prettier/prettier */
import { Telegraf } from 'telegraf';
import { Logger } from '@nestjs/common';

const logger = new Logger('TelegramBotSingleton');
let bot: Telegraf;

export const getBot = (token: string): Telegraf => {
  if (!bot) {
    logger.log('Creating a new Telegram bot instance...');
    bot = new Telegraf(token);
  }
  return bot;
};
