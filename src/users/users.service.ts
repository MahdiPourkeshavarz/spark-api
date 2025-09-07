/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  create(
    createUserDto: CreateUserDto & { password_hash: string },
  ): Promise<User> {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username: username.toLowerCase() }).exec();
  }
}
