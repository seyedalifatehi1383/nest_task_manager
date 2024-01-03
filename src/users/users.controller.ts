import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { ResultList } from 'nest-arango';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبتنام کاربر توسط ادمین',
  })
  async createUser(@Body() user: UserEntity, @Request() req): Promise<Object> {
    return this.usersService.createUser(user, req.user.email);
  }

  @Get()
  @ApiOperation({
    summary: 'گرفتن تمامی کاربران',
  })
  async findAllUsers(
    @Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN',
  ): Promise<ResultList<UserEntity>> {
    return this.usersService.findAllUsers(role);
  }

  @Patch('changePassword')
  @ApiOperation({
    summary: 'تغییر رمز کاربر',
  })
  async changePassword(
    @Request() req,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ): Promise<Object> {
    return this.usersService.changePassword(
      req.user.email,
      passwordData.oldPassword,
      passwordData.newPassword,
    );
  }

  @Patch('increaseRole/:username')
  @ApiOperation({
    summary: 'افزایش سمت یک کاربر',
  })
  async increaseRole(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return this.usersService.increaseRole(req.user.email, username);
  }

  @Patch('decreaseRole/:username')
  @ApiOperation({
    summary: 'کاهش سمت یک کاربر',
  })
  async decreaseRole(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return this.usersService.decreaseRole(req.user.email, username);
  }

  @Patch('editUsername')
  @ApiOperation({
    summary: 'تغییر نام کاربری کاربر کنونی',
  })
  async editUsername(
    @Request() req,
    @Body() newUsername: string,
  ): Promise<Object> {
    return await this.usersService.editUsername(req.user.email, newUsername);
  }

  @Patch('editEmail')
  @ApiOperation({
    summary: 'تغییر ایمیل کاربر کنونی',
  })
  async editEmail(@Request() req, @Body() newEmail: string): Promise<Object> {
    return await this.usersService.editEmail(req.user.email, newEmail);
  }

  @Get('findByUsername/:username')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس نام کاربری اش',
  })
  async findOneUserByUsername(@Param('username') username: string): Promise<Object> {
    const selectedUser =
      await this.usersService.findOneUserByUsername(username);
    return {
      username: selectedUser.username,
      email: selectedUser.email,
      role: selectedUser.role,
    };
  }

  @Get('findByEmail/:email')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس ایمیل اش',
  })
  async findOneUserByEmail(@Param('email') email: string): Promise<Object> {
    const selectedUser =
      await this.usersService.findOneUserByEmail(email);
    return {
      username: selectedUser.username,
      email: selectedUser.email,
      role: selectedUser.role,
    };
  }

  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر',
  })
  async remove(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return await this.usersService.removeUser(username, req.user.email);
  }
}
