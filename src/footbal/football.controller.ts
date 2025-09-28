/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { MatchResultDto } from './dto/match-result.dto';
import { FootballService } from './football.service';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';

@Controller('footbal')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('last-matches')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('result-data')
  async getLastMatches(): Promise<MatchResultDto[]> {
    return this.footballService.getLastMatches();
  }
}
