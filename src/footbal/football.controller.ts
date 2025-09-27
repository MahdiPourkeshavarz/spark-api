/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get } from '@nestjs/common';
import { MatchResultDto } from './dto/match-result.dto';
import { FootballService } from './football.service';

@Controller('footbal')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('last-matches')
  async getLastMatches(): Promise<MatchResultDto[]> {
    return this.footballService.getLastMatches();
  }
}
