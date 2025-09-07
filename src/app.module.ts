/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from './config/config.module';
import { MongooseConfigModule } from './mongoose/mongooseConfigModule';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PostsModule,
    TelegramModule,
    ConfigModule,
    MongooseConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
