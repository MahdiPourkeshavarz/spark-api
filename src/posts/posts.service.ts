/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { ScraperService } from 'src/scraper/scraper.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly scraperService: ScraperService,
  ) {}

  async createFromTelegram(postDto: CreatePostDto): Promise<void> {
    try {
      await this.postModel.findOneAndUpdate(
        { text: postDto.text },
        { $setOnInsert: postDto },
        { upsert: true, new: true },
      );
      this.logger.log(`Successfully upserted post from: ${postDto.author}`);
    } catch (error) {
      this.logger.error(`Failed to create post: ${error.message}`);
    }
  }

  async importAndProcessPost(url: string): Promise<Post> {
    this.logger.log(`Starting import process for URL: ${url}`);

    const scrapedData = await this.scraperService.scrapePost(url);

    if (scrapedData.text.length > 310) {
      this.logger.warn(
        `Scraped post text from ${url} is too long (${scrapedData.text.length} chars).`,
      );
      throw new UnprocessableEntityException(
        'The text of the post exceeds the 310-character limit.',
      );
    }

    const lang = this.isFarsi(scrapedData.text) ? 'fa' : 'en';

    const postToSave: CreatePostDto = {
      text: scrapedData.text,
      author: scrapedData.author,
      lang: lang,
      source: scrapedData.source,
    };

    this.logger.log(`Saving processed post from author: ${postToSave.author}`);
    const savedPost = await this.postModel
      .findOneAndUpdate(
        { text: postToSave.text },
        { $setOnInsert: postToSave },
        { upsert: true, new: true },
      )
      .exec();

    return savedPost;
  }

  private isFarsi(text: string): boolean {
    const farsiRegex = /[\u0600-\u06FF]/;
    return farsiRegex.test(text);
  }

  async findRandomBatch(): Promise<Post[]> {
    return this.postModel.aggregate([{ $sample: { size: 100 } }]).exec();
  }
}
