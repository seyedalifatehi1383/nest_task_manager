import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ArangoModule } from 'nest-arango';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthController } from './auth.controller';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    //   signOptions: { expiresIn: '600s' },
    }),
    ArangoModule.forFeature([UserEntity]),
  ],
  providers: [AuthService, UsersService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}