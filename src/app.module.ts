/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { TelegramModule } from './telegram/telegram.module';
import { MongooseConfigModule } from './mongoose/mongooseConfigModule';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadsModule } from './uploads/uploads.module';
import { ScraperModule } from './scraper/scraper.module';
import { CryptoModule } from './crypto/crypto.module';
import { FootballModule } from './footbal/football.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ScheduleModule.forRoot(),
    PostsModule,
    TelegramModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseConfigModule,
    UploadsModule,
    ScraperModule,
    CryptoModule,
    FootballModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 180 * 1000,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
