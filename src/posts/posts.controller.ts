/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('next')
  async getNextPost() {
    const post = await this.postsService.findRandom();
    if (!post) {
      // Provide a helpful fallback if the database is still empty
      return {
        text: 'The collector bot is warming up and will fetch new posts soon. Please check back in a bit!',
        author: '@SparkApp',
        lang: 'en',
      };
    }
    return post;
  }
}
