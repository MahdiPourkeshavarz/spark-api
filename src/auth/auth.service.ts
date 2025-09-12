/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

  async signUp(
    createUserDto: CreateAuthDto,
  ): Promise<{ access_token: string }> {
    const { username, email, password } = createUserDto;

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await this.usersService.create({
      username,
      email,
      password_hash,
    });

    const payload = { sub: newUser._id, username: newUser.username };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const { username, password, email } = loginUserDto;

    const user = await this.usersService.findByEmail(email as string);

    const userByUsername = await this.usersService.findByUsername(username);

    if (
      userByUsername &&
      (await bcrypt.compare(password, userByUsername.password_hash))
    ) {
      const payload = {
        sub: userByUsername._id,
        username: userByUsername.username,
      };
      const access_token = await this.jwtService.signAsync(payload);
      return { access_token };
    }

    throw new UnauthorizedException('Please check your login credentials');
  }
}
