import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبتنام کاربر',
  })
  createUser(@Body() user: UserEntity) {
    return this.usersService.createUser(user);
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({
    summary: 'گرفتن تمامی کاربران',
  })
  findAll(@Request() req, @Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN') {
    const reqUser = req.user
    if (reqUser.role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see users')
    }
    return this.usersService.findAll(role);
  }

  @UseGuards(AuthGuard)
  @Patch('increaseRole/:username')
  @ApiOperation({
    summary: 'افزایش سمت یک کاربر',
  })
  increaseRole(@Request() req, @Param('username') username: string) {
    const reqUser = req.user
    if (reqUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can increase users roles')
    }
    return this.usersService.updateUser(username, {"role": "SUB_ADMIN"});
  }

  @UseGuards(AuthGuard)
  @Get(':username')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس نام کاربری اش',
  })
  findOneUser(@Request() req, @Param('username') username: string) {
    const reqUser = req.user
    if (reqUser.role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see users')
    }
    return this.usersService.findOneUserByUsername(username);
  }

  @UseGuards(AuthGuard)
  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر',
  })
  async remove(@Request() req, @Param('username') username: string): Promise<void> {
    const reqUser = req.user
    if (reqUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users')
    }
    return await this.usersService.removeUser(username);
  }
}
