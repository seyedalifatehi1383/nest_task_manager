import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthService } from './auth/auth.service';
import { ArangoModule } from 'nest-arango';
import { UsersService } from './users/users.service';
import { UserEntity } from './users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { AuthController } from './auth/auth.controller';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    UsersModule,
    ArangoModule.forRoot({
      config: {
        url: 'http://localhost:8529',
        databaseName: '_system',
        auth: {
          username: 'root',
          password: 'azim1383'
        },
      },
    }),
    ArangoModule.forFeature([
      UserEntity,
    ]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      // signOptions: { expiresIn: '3600s' },
    }),
    TasksModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, UsersService],
  
})
export class AppModule {}
