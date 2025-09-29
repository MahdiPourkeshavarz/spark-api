/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { MatchResultDto } from './dto/match-result.dto';
import { FootballService } from './football.service';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';

@Controller('football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('last-matches')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('result-data')
  async getLastMatches(): Promise<MatchResultDto[]> {
    return this.footballService.getLastMatches();
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return this.footballService.searchTeam(name);
  }
}
