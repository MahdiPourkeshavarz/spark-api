/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {}

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(
              new InternalServerErrorException('Failed to upload image.'),
            );
          }
          resolve(result);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadProfileImage(
    file: Express.Multer.File,
  ): Promise<{ secure_url: string; public_id: string }> {
    const result = await this.uploadToCloudinary(file, 'dishdash_profiles');
    return { secure_url: result.secure_url, public_id: result.public_id };
  }
}
