import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
  UseInterceptors,
  Req,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
// Assuming this exists for query params
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Use the real JwtAuthGuard
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { Task } from './entities/task.entity';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskStatsDto } from './dto/response-stats.dto';
import { PaginationDto } from './dto/response.filtered.data.dto';
import { BatchProcessResultDto } from './dto/response-batch-process-result.dto';
import { AdminGuard } from '@common/guards/admin.guard';
import { ERROR_MESSAGES } from '@common/constants/error.constants';
@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  // @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(@Req() request: Request, @Body() createTaskDto: CreateTaskDto) {
    const user = (request as any).user;
    if (!user || !user.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (user.id !== createTaskDto.userId) {
      throw new HttpException('You cannot create a task for yourself', HttpStatus.BAD_REQUEST);
    }
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find all tasks with optional filtering and pagination' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'createdAfter', required: false, type: String })
  @ApiQuery({ name: 'createdBefore', required: false, type: String })
  @ApiQuery({ name: 'dueAfter', required: false, type: String })
  @ApiQuery({ name: 'dueBefore', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of tasks with pagination metadata' })
  async findAll(@Query() filter: TaskFilterDto, @Req() req: any): Promise<PaginationDto<Task>> {
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    }
    return this.tasksService.findAll(filter);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({ status: 200, description: 'Task statistics' })
  async getStats(@Req() req: any): Promise<TaskStatsDto> {
    const userId = req.user.role !== 'admin' ? req.user.id : undefined;
    return this.tasksService.getStats(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved task details',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User cannot access this task',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found with the specified ID',
  })
  async findOne(
    @Req() req: { user: { id: string; role: string } },
    @Param('id') id: string,
  ): Promise<Task> {
    return await this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Req() req: { user: { id: string; role: string } },
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto,req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Req() req: { user: { id: string; role: string } },@Param('id') id: string) {
    await this.tasksService.remove(id,req.user);
    return { message: 'Task deleted successfully' };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  @ApiResponse({ status: 200, description: 'Batch operation results' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: { type: 'string' },
          example: ['660e8400-e29b-41d4-a716-446655440004'],
        },
        action: {
          type: 'string',
          example: 'complete',
        },
      },
      required: ['tasks', 'action'],
    },
  })
  async batchProcess(@Req() req: { user: { id: string; role: string } },
    @Body() operations: { tasks: string[]; action: string },
  ): Promise<BatchProcessResultDto[]> {
    const { tasks: taskIds, action } = operations;
    return this.tasksService.batchProcess(taskIds, action,req.user);
  }
}
