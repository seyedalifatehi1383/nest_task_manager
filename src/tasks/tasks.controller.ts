import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({
    summary: 'تعریف کردن تسک',
  })
  async defineTask(
    @Request() req,
    @Body() taskData: { task: TaskEntity; username: string },
  ): Promise<TaskEntity> {
    return await this.tasksService.defineTask(
      taskData.task,
      taskData.username,
      req.user.email,
    );
  }

  @Get('subAdmins')
  @ApiOperation({
    summary: 'نشان دادن تسک های ساب ادمین ها',
  })
  async showTasksOfSubAdmins(@Request() req): Promise<any> {
    return await this.tasksService.showTasksOfSubAdmins(req.user.email);
  }

  @Get('users')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربران عادی',
  })
  async showTasksOfUsers(@Request() req): Promise<any> {
    return await this.tasksService.showTasksOfUsers(req.user.email);
  }

  @Patch('changeTitle/:taskKey')
  @ApiOperation({
    summary: 'تغییر عنوان یک تسک',
  })
  async changeTitle(
    @Param('taskKey') taskKey: string,
    @Body() newTitleData: { newTitle: string },
    @Request() req,
  ) {
    return await this.tasksService.changeTitle(
      taskKey,
      newTitleData.newTitle,
      req.user.email,
    );
  }

  @Patch('changeDescription/:taskKey')
  @ApiOperation({
    summary: 'تغییر توضیحات یک تسک',
  })
  async changeDescription(
    @Param('taskKey') taskKey: string,
    @Body() newDescriptionData: { newDescription: string },
    @Request() req,
  ) {
    return await this.tasksService.changeDescription(
      taskKey,
      newDescriptionData.newDescription,
      req.user.email,
    );
  }

  @Patch('acceptTask/:taskKey')
  @ApiOperation({
    summary: 'تغییر توضیحات یک تسک',
  })
  async acceptTask(@Param('taskKey') taskKey: string, @Request() req) {
    return await this.tasksService.acceptTask(taskKey, req.user.email);
  }

  @Get('showEnteredUserTasks')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربر وارد شده',
  })
  async showEnteredUserTasks(@Request() req) {
    return await this.tasksService.showEnteredUserTasks(req.user.email);
  }

  @Get('showDesiredUserTasks/:username')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربر دلخواه',
  })
  async showDesiredUserTasks(
    @Request() req,
    @Param('username') desiredUserUsername: string,
  ) {
    return await this.tasksService.showDesiredUserTasks(
      req.user.email,
      desiredUserUsername,
    );
  }

  @Delete(':taskKey')
  @ApiOperation({
    summary: 'حذف کردن تسک',
  })
  async removeTask(
    @Request() req,
    @Param('taskKey') taskKey: string,
  ): Promise<void> {
    return await this.tasksService.removeTask(
      'Tasks/' + taskKey,
      req.user.email,
    );
  }
}
