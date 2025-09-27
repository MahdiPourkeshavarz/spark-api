/* eslint-disable prettier/prettier */
import { IsNumber, IsString } from 'class-validator';

export class TeamDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  league: string;
}
