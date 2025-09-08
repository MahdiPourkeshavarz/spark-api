/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('batch')
  async getPostBatch(): Promise<Post[]> {
    const posts = await this.postsService.findRandomBatch();

    if (!posts || posts.length === 0) {
      return [
        {
          text: 'The collector bot is warming up and will fetch new posts soon. Please check back in a bit!',
          author: '@SparkApp',
          lang: 'en',
        },
      ] as Post[];
    }

    return posts;
  }
}
