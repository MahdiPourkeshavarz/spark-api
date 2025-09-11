/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import chromium from '@sparticuz/chromium';

interface ScrapedPost {
  text: string;
  author: string;
  source?: string;
  imageUrl?: string;
}

@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);
  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Puppeteer-core...');
    try {
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--remote-debugging-port=9222',
          '--remote-debugging-address=0.0.0.0',
        ],
      };

      // Use @sparticuz/chromium for production environment
      if (process.env.NODE_ENV === 'production') {
        try {
          const chromium = require('@sparticuz/chromium');
          launchOptions.args = chromium.args || launchOptions.args;

          const executablePath = await chromium.executablePath();
          if (executablePath) {
            launchOptions.executablePath = executablePath;
            this.logger.log('Using @sparticuz/chromium executable');
          } else {
            // Fallback to system Chrome if chromium executable is not found
            launchOptions.executablePath = '/usr/bin/chromium-browser';
            this.logger.warn(
              'Chromium executable not found, using system Chrome',
            );
          }
        } catch (chromiumError) {
          this.logger.warn(
            '@sparticuz/chromium not available, using system Chrome',
          );
          launchOptions.executablePath = '/usr/bin/chromium-browser';
        }
      } else {
        // For local development
        launchOptions.executablePath =
          process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.logger.log('Puppeteer browser successfully launched.');
    } catch (error: any) {
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
      const authorSelector = 'div[data-testid="User-Name"] span';
      const imageSelector =
        'article[data-testid="tweet"] div[data-testid="tweetPhoto"] img';
      await page.waitForSelector(textSelector, { timeout: 15000 });
      const text = await page.$eval(
        textSelector,
        (el) => (el as HTMLElement).innerText,
      );
      const author = await page.$eval(
        authorSelector,
        (el) => (el as HTMLElement).innerText,
      );
      let imageUrl: string | undefined = undefined;
      try {
        imageUrl = await page.$eval(
          imageSelector,
          (el) => (el as HTMLImageElement).src,
        );
      } catch (error) {
        this.logger.log('No image found for this tweet, which is normal.');
      }
      return { text, author: `@${author}`, source: 'twitter', imageUrl };
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
    const imageUrl = $('meta[property="og:image"]').attr('content');
    const parsedPost = this._parseTelegramDescription(description);
    if (!parsedPost)
      throw new BadGatewayException(
        'Could not parse author from Telegram preview content.',
      );
    return { ...parsedPost, imageUrl };
  }

  private _parseTelegramDescription(
    text: string,
  ): { text: string; author: string; source: string } | null {
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
    if (!author) {
      author = 'telegram';
    }
    const postText = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();
    return { text: postText, author, source: 'telegram' };
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }
}
