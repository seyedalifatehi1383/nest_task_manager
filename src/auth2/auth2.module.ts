import { Module } from '@nestjs/common';
import { Auth2Service } from './auth2.service';
import { Auth2Controller } from './auth2.controller';
import { UsersService } from 'src/users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  providers: [Auth2Service, UsersService, JwtService],
  controllers: [Auth2Controller],
  imports: [
    JwtModule.register({
      secret: process.env.jwt_secret,
      signOptions: {
        // expiresIn: '3600s',
      },
    }),
  ],
})
export class Auth2Module {}
