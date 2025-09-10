/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
