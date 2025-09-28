/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';

@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('all')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('crypto-data')
  async getAll() {
    return this.cryptoService.getTopCoins();
  }

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    return this.cryptoService.getCoinById(id);
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return this.cryptoService.searchCoins(name);
  }
}
