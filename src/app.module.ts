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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
