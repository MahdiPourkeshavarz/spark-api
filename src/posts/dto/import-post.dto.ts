/* eslint-disable prettier/prettier */

import { IsUrl } from 'class-validator';

export class ImportPostDto {
  @IsUrl({}, { message: 'Please provide a valid URL.' })
  url: string;
}
