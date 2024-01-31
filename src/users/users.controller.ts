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
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipeBuilder,
  HttpStatus,
  NotFoundException,
  Res,
  StreamableFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fsPromise from 'fs/promises';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { PasswordDataDto } from './dto/password-data.dto';
import { NewEmailDataDto } from './dto/new-email-data.dto';
import { createReadStream } from 'fs';
import { join } from 'path';
import * as pdfkit from 'pdfkit'; // Import pdfkit for PDF generation
import { Response } from 'express';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبتنام کاربر توسط ادمین',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
      },
    },
  })
  async createUser(@Body() user: UserEntity, @Request() req): Promise<Object> {
    return await this.usersService.createUser(user, req.user._id);
  }

  @Get()
  @ApiOperation({
    summary: 'گرفتن تمامی کاربران یا گرفتن کاربران براساس سمتشان',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['USER', 'SUB_ADMIN', 'ADMIN'],
  })
  async findAllUsers(
    @Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN',
  ): Promise<any> {
    return await this.usersService.findAllUsers(role);
  }

  @Patch('changePassword')
  @ApiOperation({
    summary: 'تغییر رمز کاربر',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: {
          type: 'string',
        },
        newPassword: {
          type: 'string',
        },
      },
    },
  })
  async changePassword(
    @Request() req,
    @Body() passwordDataDto: PasswordDataDto,
  ): Promise<Object> {
    return await this.usersService.changePassword(
      req.user._id,
      passwordDataDto.oldPassword,
      passwordDataDto.newPassword,
    );
  }

  // this controller changes the role of a user based on his/her current user
  // if user's role is USER, it changrd to SUB_ADMIN
  // and if user's role is SUB_ADMIN, it changed to USER
  @Patch('changeRole/:username')
  @ApiOperation({
    summary: 'تغییر سمت یک کاربر',
  })
  async changeRole(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return await this.usersService.changeRole(req.user._id, username);
  }

  @Patch('editUsername')
  @ApiOperation({
    summary: 'تغییر نام کاربری کاربر کنونی',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newUsername: {
          type: 'string',
        },
      },
    },
  })
  async editUsername(
    @Request() req,
    @Body() newUsernameData: { newUsername: string },
  ): Promise<Object> {
    return await this.usersService.editUsername(
      req.user._id,
      newUsernameData.newUsername,
    );
  }

  @Patch('editEmail')
  @ApiOperation({
    summary: 'تغییر ایمیل کاربر کنونی',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newEmail: {
          type: 'string',
          format: 'email',
        },
      },
    },
  })
  async editEmail(
    @Request() req,
    @Body() newEmailDataDto: NewEmailDataDto,
  ): Promise<Object> {
    return await this.usersService.editEmail(
      req.user._id,
      newEmailDataDto.newEmail,
    );
  }

  // this method uploads current users profile photo
  @Post('uploadProfilePhoto')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'اپلود عکس پروفایل',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfilePhoto(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .addMaxSizeValidator({
          maxSize: 2097152,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    image: Express.Multer.File,
    @Request() req,
  ) {
    const currentUser = await this.usersService.findOneUserById(req.user._id);
    if (currentUser.userProfilePhotoPath.length !== 0) {
      throw new ForbiddenException(
        'you currently have profile photo. for set a new profile photo you should delete your profile photo first',
      );
    }

    const imageId = await uuidv4();
    const folderPath: string = './images/profiles/';
    const imageBuffer = image.buffer;
    const imagePath = path.join(folderPath, `${currentUser.username}.jpeg`);
    await fsPromise.writeFile(imagePath, imageBuffer);

    console.log(imagePath)
    currentUser.userProfilePhotoPath = imagePath;
    await this.usersService.updateUser(currentUser, currentUser);

    return {
      imageId: await imageId,
      message: 'photo uploaded successfully',
    };
  }

  @Get('downloadProfilePhoto/:username')
  @ApiOperation({
    summary: 'دانلود عکس پروفایل',
  })
  async downloadProfilePhoto(
    @Res({ passthrough: true }) res,
    @Param('username') username: string,
  ): Promise<StreamableFile> {
    const wantedUser = await this.usersService.findOneUserByUsername(username);
    if (wantedUser.userProfilePhotoPath.length === 0) {
      throw new NotFoundException('this user doesnt have profile photo');
    }

    const file = createReadStream(
      join(process.cwd(), `${wantedUser.userProfilePhotoPath}`),
    );
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${wantedUser.username}.jpeg`,
    });
    return new StreamableFile(file);
  }

  @Delete('deleteProfilePhoto')
  async deleteFile(@Request() req) {
    const currentUser = await this.usersService.findOneUserById(req.user._id)
    if (currentUser.userProfilePhotoPath.length === 0) {
      throw new ForbiddenException('you currently dont have profile photo')
    }

    currentUser.userProfilePhotoPath = '';
    await this.usersService.updateUser(currentUser, currentUser);
    await fs.unlink(`./${currentUser.userProfilePhotoPath}`, (err) => {
    if (err) {
      console.error(err);
      return err;
    }
    });

    return {
      message: "your profile photo deleted successfully"
    }
  }

  @Get('findByUsername/:username')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس نام کاربری اش',
  })
  async findOneUserByUsername(
    @Param('username') username: string,
  ): Promise<Object> {
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
    const selectedUser = await this.usersService.findOneUserByEmail(email);
    if (!selectedUser) {
      throw new NotFoundException('Email Not Found');
    }

    return {
      username: selectedUser.username,
      email: selectedUser.email,
      role: selectedUser.role,
    };
  }

  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر توسط ادمین',
  })
  async remove(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return await this.usersService.removeUser(username, req.user._id);
  }
}
