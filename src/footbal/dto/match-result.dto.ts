/* eslint-disable prettier/prettier */
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class MatchResultDto {
  @IsString()
  home: string;

  @IsString()
  away: string;

  @IsString()
  score: string;

  @IsString()
  @IsOptional()
  winner: string;

  @IsDateString()
  date: string;

  @IsString()
  competition: string;
}
