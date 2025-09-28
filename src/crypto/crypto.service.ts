/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Crypto } from './dto/crypto.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  api_symbol: string;
  thumb: string;
  large: string;
  market_cap_rank: number;
}

@Injectable()
export class CryptoService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.get<string>('COINGECKO_API_KEY') as string;
  }

  async getTopCoins(): Promise<Crypto[]> {
    const url = `${this.baseUrl}/coins/markets`;
    const params = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 50,
      page: 1,
      sparkline: false,
      x_cg_demo_api_key: this.apiKey,
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<Crypto[]>(url, { params }),
      );
      return data;
    } catch (error) {
      console.error('Error fetching top coins:', error.message);
      throw new Error('Failed to fetch top cryptocurrency data.');
    }
  }

  async getCoinById(id: string): Promise<Crypto> {
    const cacheKey = `crypto-${id}`;

    const cachedData = (await this.cacheManager.get(cacheKey)) as Crypto;

    if (cachedData) {
      return cachedData;
    }

    const url = `${this.baseUrl}/coins/markets`;
    const params = {
      vs_currency: 'usd',
      ids: id,
      x_cg_demo_api_key: this.apiKey,
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<Crypto[]>(url, { params }),
      );

      if (!data || data.length === 0) {
        throw new NotFoundException(
          `Cryptocurrency with ID "${id}" not found.`,
        );
      }

      await this.cacheManager.set(cacheKey, data[0], 120 * 1000);

      return data[0];
    } catch (error) {
      console.error(`Error fetching coin by ID (${id}):`, error.message);
      if (error instanceof NotFoundException) throw error;
      throw new Error('Failed to fetch cryptocurrency data.');
    }
  }

  async searchCoins(query: string): Promise<SearchResult | null> {
    if (!query || query.trim() === '') {
      return null;
    }

    const cacheKey = `query-${query}`;

    const cachedData = (await this.cacheManager.get(cacheKey)) as SearchResult;

    if (cachedData) {
      return cachedData;
    }

    const url = `${this.baseUrl}/search`;
    const params = {
      query,
      x_cg_demo_api_key: this.apiKey,
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ coins: SearchResult[] }>(url, { params }),
      );

      await this.cacheManager.set(cacheKey, data.coins[0], 120 * 1000);

      return data.coins[0];
    } catch (error) {
      console.error(`Error searching for coins (${query}):`, error.message);
      throw new Error('Failed to perform cryptocurrency search.');
    }
  }
}
