/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { subMonths, format } from 'date-fns';
import axiosRetry from 'axios-retry';
import { TeamDto } from './dto/team.dto';
import { MatchResultDto } from './dto/match-result.dto';
import { allEuropeanLeaguesData, teamData } from './constants/teams';
import { ConfigService } from '@nestjs/config';
import Fuse from 'fuse.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class FootballService {
  private readonly logger = new Logger(FootballService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.football-data.org/v4';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: (retryCount) => retryCount * 1500,
    });
    this.apiKey = configService.get<string>('FOOTBALL_API_KEY') as string;
  }

  async getLastMatches(): Promise<MatchResultDto[]> {
    const results: MatchResultDto[] = [];
    for (const team of teamData) {
      const match = await this.fetchLastMatch(team);
      results.push(match);
    }
    return results;
  }

  async searchTeam(name: string) {
    const fuse = new Fuse(allEuropeanLeaguesData, {
      keys: ['name', 'shortName'],
      threshold: 0.7,
    });

    const result = fuse.search(name);

    const teamId = result && result[0].item.id;

    if (teamId) {
      const match = await this.fetchLastMatch(result[0].item);
      return match;
    } else {
      throw NotFoundException;
    }
  }

  private async fetchLastMatch(team: TeamDto): Promise<MatchResultDto> {
    const dateFrom = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
    const dateTo = format(new Date(), 'yyyy-MM-dd');
    const cacheKey = `last-match-${team.id}`;

    const cached = (await this.cacheManager.get(cacheKey)) as MatchResultDto;

    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/teams/${team.id}/matches`, {
            params: {
              status: 'FINISHED',
              dateFrom,
              dateTo,
              limit: 10,
            },
            headers: { 'X-Auth-Token': this.apiKey },
          })
          .pipe(
            catchError((error) => {
              this.logger.error(
                `Error fetching for ${team.name}: ${error.message}`,
              );
              throw new HttpException('API Error', HttpStatus.BAD_GATEWAY);
            }),
          ),
      );

      const matches = response.data.matches || [];
      if (!matches.length) {
        return {
          home: '',
          away: '',
          score: '',
          winner: '',
          date: '',
          competition: 'No recent matches',
        };
      }

      matches.sort(
        (a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
      );
      const lastMatch = matches[0];

      const res = {
        home: lastMatch.homeTeam.name,
        away: lastMatch.awayTeam.name,
        score: `${lastMatch.score.fullTime.home} - ${lastMatch.score.fullTime.away}`,
        winner: lastMatch.score.winner,
        date: lastMatch.utcDate,
        competition: lastMatch.competition.name,
      };

      await this.cacheManager.set(cacheKey, res, 240 * 1000);

      return res;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
