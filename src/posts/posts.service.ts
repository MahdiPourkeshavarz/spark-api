/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

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

  async findRandomBatch(): Promise<Post[]> {
    return this.postModel.aggregate([{ $sample: { size: 100 } }]).exec();
  }
}
