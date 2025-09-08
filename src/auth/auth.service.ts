/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateAuthDto): Promise<{ message: string }> {
    const { username, email, password } = createUserDto;

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);

    await this.usersService.create({ username, email, password_hash });

    return { message: 'User successfully registered. Please log in.' };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const { username, password } = loginUserDto;
    const user = await this.usersService.findByUsername(username);

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const payload = { sub: user._id, username: user.username };
      const access_token = await this.jwtService.signAsync(payload);
      return { access_token };
    }

    throw new UnauthorizedException('Please check your login credentials');
  }
}
