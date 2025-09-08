/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  BadGatewayException,
  BadRequestException,
} from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer-core';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';

interface ScrapedPost {
  text: string;
  author: string;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Puppeteer-core...');
    try {
      const executablePath = this.configService.get<string>(
        'CHROME_EXECUTABLE_PATH',
      );
      if (!executablePath) {
        throw new Error(
          'CHROME_EXECUTABLE_PATH is not set in .env file. Puppeteer cannot start.',
        );
      }
      this.browser = await puppeteer.launch({
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.log('Puppeteer browser successfully launched.');
    } catch (error) {
      this.logger.error(
        'Failed to launch browser. Twitter scraping will be unavailable.',
        error.stack,
      );
    }
  }

  async scrapePost(url: string): Promise<ScrapedPost> {
    if (url.includes('twitter.com') || url.includes('x.com')) {
      if (!this.browser)
        throw new BadGatewayException(
          'Browser service for Twitter scraping is not available.',
        );
      this.logger.log('Twitter/X URL detected. Using Puppeteer scraper.');
      return this._scrapeTwitter(url);
    } else if (url.includes('t.me')) {
      this.logger.log('Telegram URL detected. Using Cheerio scraper.');
      return this._scrapeTelegram(url);
    } else {
      throw new BadRequestException(
        'Unsupported URL. Please provide a link from X/Twitter or Telegram.',
      );
    }
  }

  private async _scrapeTwitter(url: string): Promise<ScrapedPost> {
    if (!this.browser) {
      throw new BadGatewayException(
        'Browser service for Twitter scraping is not available.',
      );
    }
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      const textSelector =
        'article[data-testid="tweet"] div[data-testid="tweetText"]';
      const authorSelector =
        'div[data-testid="User-Name"] span:not(:contains("@"))';
      await page.waitForSelector(textSelector, { timeout: 15000 });
      const text = await page.$eval(
        textSelector,
        (el) => (el as HTMLElement).innerText,
      );
      const author = await page.$eval(
        authorSelector,
        (el) => (el as HTMLElement).innerText,
      );
      return { text, author: `@${author}` };
    } finally {
      await page.close();
    }
  }

  private async _scrapeTelegram(url: string): Promise<ScrapedPost> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const description = $('meta[property="og:description"]').attr('content');
    if (!description)
      throw new BadGatewayException(
        'Could not find post content in Telegram preview.',
      );
    const parsedPost = this._parseTelegramDescription(description);
    if (!parsedPost)
      throw new BadGatewayException(
        'Could not parse author from Telegram preview content.',
      );
    return parsedPost;
  }

  private _parseTelegramDescription(
    text: string,
  ): { text: string; author: string } | null {
    let lines = text
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');
    if (lines.length < 2) return null;
    const potentialChannelId = lines[lines.length - 1].trim();
    if (potentialChannelId.startsWith('@')) {
      lines.pop();
    }
    if (lines.length < 2) return null;
    const authorLine = lines[lines.length - 1].trim();
    let author: string | null = null;
    const separator = authorLine.includes('•')
      ? '•'
      : authorLine.length >= 3 &&
          authorLine.charAt(0) === authorLine.charAt(authorLine.length - 1)
        ? authorLine.charAt(0)
        : null;
    if (separator) {
      author = authorLine.split(separator).filter(Boolean)[0].trim();
    }
    if (!author) return null;
    const postText = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    return { text: postText, author };
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }
}
