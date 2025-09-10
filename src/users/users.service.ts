/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly uploadsService: UploadsService,
    private readonly jwtService: JwtService,
  ) {}

  create(
    createUserDto: CreateUserDto & { password_hash: string },
  ): Promise<UserDocument> {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<{ user: Partial<UserDocument>; access_token: string }> {
    const updateData: Partial<User> = { ...updateUserDto };

    if (file) {
      console.log('Processing file:', file.originalname, file.mimetype);
      const uploadResult = await this.uploadsService.uploadProfileImage(file);
      const newImageUrl = uploadResult.secure_url;

      console.log('New Cloudinary image URL:', newImageUrl);
      updateData.image = newImageUrl;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const payload = {
      sub: updatedUser._id,
      username: updatedUser.username,
      image: updatedUser.image,
    };

    const newAccessToken = await this.jwtService.signAsync(payload);

    const { password_hash, __v, createdAt, updatedAt, ...cleanUser } =
      updatedUser.toObject();
    return { user: cleanUser, access_token: newAccessToken };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.toLowerCase() }).exec();
  }
}
