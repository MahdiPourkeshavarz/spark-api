/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ScrapedPost {
  text: string;
  author: string;
  source?: string;
  imageUrl?: string;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private readonly configService: ConfigService) {}

  async scrapePost(url: string): Promise<ScrapedPost> {
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return this._scrapeTwitter(url);
    } else if (url.includes('t.me')) {
      return this._scrapeTelegram(url);
    } else {
      throw new BadRequestException('Unsupported URL.');
    }
  }

  private async _scrapeTwitter(url: string): Promise<ScrapedPost> {
    try {
      // Step 1: Get the initial oEmbed data
      const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await axios.get(oEmbedUrl);
      const data = response.data;

      if (!data || !data.html) {
        throw new BadGatewayException(
          'Could not retrieve tweet data from oEmbed API.',
        );
      }

      const $ = cheerio.load(data.html);
      const paragraph = $('blockquote p');

      const pClone = paragraph.clone();
      pClone.find('a').last().remove();
      let text = pClone.text().trim();

      const author = `@${data.author_name}` || 'Unknown Author';
      const lang = (paragraph.attr('lang') as 'en' | 'fa') || 'unknown';

      text = text.replace(/pic\.twitter\.com\/[a-zA-Z0-9]+/, '').trim();

      this.logger.log(`Scraped Tweet | Lang: ${lang} | Author: ${author} `);
      return { text, author, source: 'twitter' };
    } catch (error) {
      this.logger.error(`Failed to scrape Tweet: ${error.message}`);
      throw new BadGatewayException('Failed to retrieve tweet data.');
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

    const postText = lines
      .slice(0, lines.length - 1)
      .join('\n')
      .trim();

    return { text: postText, author, source: 'telegram' };
  }
}
