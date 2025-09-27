/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FootballService } from './football.service';
import { FootballController } from './football.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [FootballController],
  providers: [FootballService],
})
export class FootballModule {}
