/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post as PostDocument } from './entities/post.entity';
import { ImportPostDto } from './dto/import-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('batch')
  async getPostBatch(): Promise<PostDocument[]> {
    const posts = await this.postsService.findRandomBatch();

    if (!posts || posts.length === 0) {
      return [
        {
          text: 'The collector bot is warming up and will fetch new posts soon. Please check back in a bit!',
          author: '@SparkApp',
          lang: 'en',
        },
      ] as PostDocument[];
    }

    return posts;
  }

  @Post('import')
  async importPost(@Body() importPostDto: ImportPostDto) {
    return this.postsService.importAndProcessPost(importPostDto.url);
  }
}
