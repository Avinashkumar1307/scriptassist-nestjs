import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { CacheService } from '../../common/services/cache.service';
import { ERROR_MESSAGES } from '../../common/constants/error.constants';
import { Logger } from '@nestjs/common';
import { TaskStatsDto } from './dto/response-stats.dto';
import { PaginationDto } from './dto/response.filtered.data.dto';
import { BatchProcessResultDto } from './dto/response-batch-process-result.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheService,
  ) {}

  private async handleTaskQueue(taskId: string, status: TaskStatus): Promise<void> {
    try {
      await this.taskQueue.add(
        'task-status-update',
        { taskId, status },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue task ${taskId} status update`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.QUEUE_ERROR);
    }
  }

  private async validateTaskExists(id: string): Promise<Task> {
    console.log(`Validating task existence for ID: ${id}`);
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, email: true, name: true },
      },
    });

    if (!task) {
      throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND(id));
    }
    return task;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      this.logger.log(`Creating task: ${createTaskDto.title}`);

      return await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
        const task = this.tasksRepository.create(createTaskDto);
        const savedTask = await transactionalEntityManager.save(task);

        await this.handleTaskQueue(savedTask.id, savedTask.status);
        return savedTask;
      });
    } catch (error) {
      this.logError(error, 'create');

      if (error instanceof InternalServerErrorException) throw error;
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException(ERROR_MESSAGES.TASKS.CONFLICT);
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.CREATE_FAILED);
    }
  }

  private buildTaskQuery(filter: TaskFilterDto) {
    const {
      status,
      priority,
      userId,
      search,
      createdAfter,
      createdBefore,
      dueAfter,
      dueBefore,
      page = 1,
      limit = 10,
    } = filter;

    // Debug: log the received filter
    console.log('Received in buildTaskQuery:', filter);

    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user');

    // Status filter
    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    // Priority filter
    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    // User filter - IMPORTANT: use the correct field name
    if (userId) {
      query.andWhere('task.userId = :userId', { userId });
      console.log('Applying userId filter:', userId); // Debug log
    }

    // Search filter
    if (search) {
      query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Date filters
    if (createdAfter) {
      const date = new Date(createdAfter);
      query.andWhere('task.createdAt >= :createdAfter', { createdAfter: date });
    }

    if (createdBefore) {
      const date = new Date(createdBefore);
      query.andWhere('task.createdAt <= :createdBefore', { createdBefore: date });
    }

    if (dueAfter) {
      const date = new Date(dueAfter);
      query.andWhere('task.dueDate >= :dueAfter', { dueAfter: date });
    }

    if (dueBefore) {
      const date = new Date(dueBefore);
      query.andWhere('task.dueDate <= :dueBefore', { dueBefore: date });
    }

    // Default ordering
    query.orderBy('task.createdAt', 'DESC');

    return { query, page, limit };
  }

  async findAll(filter: TaskFilterDto): Promise<PaginationDto<Task>> {
    try {
      // Validate pagination parameters
      const pagegiven = filter.page ?? 1;
      const limitgiven = filter.limit ?? 10;

      if (pagegiven < 1 || limitgiven < 1) {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.INVALID_PAGINATION);
      }

      // Check cache first
      const cacheKey = `tasks:${JSON.stringify(filter)}`;
      const cachedResults = await this.cacheService.get<PaginationDto<Task>>(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      // Build and execute query
      const { query, page, limit } = this.buildTaskQuery(filter);
      const skip = (page - 1) * limit;
      console.log(`Fetching tasks for page ${query} with limit ${limit}...`);
      const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

      // Prepare result
      const result: PaginationDto<Task> = {
        data,
        count: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // Cache the result
      await this.cacheService.set(cacheKey, result, 60);

      return result;
    } catch (error) {
      this.logError(error, 'findAll');
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.FETCH_FAILED);
    }
  }

  async findOne(id: string, user: any): Promise<Task> {
    try {
      console.log(`Fetching task with ID: ${id}`);
      const task = await this.validateTaskExists(id);
      if (!task) throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND);

      const canAccessTask = user.role === 'admin' || task.userId === user.id;
      if (!canAccessTask) {
        throw new UnauthorizedException('You cannot access this task');
      }
      return task;
    } catch (error) {
      this.logError(error, `findOne(${id})`);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(ERROR_MESSAGES.TASKS.FETCH_FAILED);
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: any): Promise<Task> {
    console.log(`Updating task with ID: ${id}`);
    console.log(id);
    try {
      return await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
        const task = await this.validateTaskExists(id);
        if (!task) throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND);
        const canAccessTask = user.role === 'admin' || task.userId === user.id;
        if (!canAccessTask) {
          throw new UnauthorizedException('You cannot update this task');
        }
        const originalStatus = task.status;

        Object.assign(task, updateTaskDto);
        const updatedTask = await transactionalEntityManager.save(task);

        if (updateTaskDto.status && originalStatus !== updateTaskDto.status) {
          await this.handleTaskQueue(updatedTask.id, updatedTask.status);
        }

        return updatedTask;
      });
    } catch (error) {
      this.logError(error, `update(${id})`);

      if (error instanceof NotFoundException || error instanceof InternalServerErrorException)
        throw error;

      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException(ERROR_MESSAGES.TASKS.CONFLICT);
      }

      throw new InternalServerErrorException('You can update own tasks only');
    }
  }

  async remove(id: string, user: any): Promise<void> {
    try {
      const task = await this.validateTaskExists(id);
      if (!task) throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND);
      const canAccessTask = user.role === 'admin' || task.userId === user.id;
      if (!canAccessTask) {
        throw new UnauthorizedException('You cannot update this task');
      }
      await this.tasksRepository.remove(task);
    } catch (error) {
      this.logError(error, `remove(${id})`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.DELETE_FAILED);
    }
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      return await this.tasksRepository.find({
        where: { status },
        relations: ['user'],
        select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, email: true, name: true },
      },
      });
    } catch (error) {
      this.logError(error, `findByStatus(${status})`);
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.FETCH_FAILED);
    }
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      const task = await this.validateTaskExists(id);
      task.status = status;

      const updatedTask = await this.tasksRepository.save(task);
      await this.handleTaskQueue(updatedTask.id, updatedTask.status);

      return updatedTask;
    } catch (error) {
      this.logError(error, `updateStatus(${id})`);

      if (error instanceof NotFoundException || error instanceof InternalServerErrorException)
        throw error;

      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.UPDATE_FAILED);
    }
  }

  async getStats(userId?: string): Promise<TaskStatsDto> {
    try {
      const queryBuilder = this.tasksRepository
        .createQueryBuilder('task')
        .select([
          'COUNT(*) as total',
          `COUNT(CASE WHEN task.status = :completed THEN 1 END) as completed`,
          `COUNT(CASE WHEN task.status = :inProgress THEN 1 END) as inProgress`,
          `COUNT(CASE WHEN task.status = :pending THEN 1 END) as pending`,
          `COUNT(CASE WHEN task.priority = :high THEN 1 END) as highPriority`,
        ])
        .setParameters({
          completed: TaskStatus.COMPLETED,
          inProgress: TaskStatus.IN_PROGRESS,
          pending: TaskStatus.PENDING,
          high: TaskPriority.HIGH,
        });

      // Add user filter if userId is provided (for non-admin users)
      if (userId) {
        queryBuilder.where('task.userId = :userId', { userId });
      }

      const query = await queryBuilder.getRawOne();

      return {
        total: parseInt(query.total),
        completed: parseInt(query.completed),
        inProgress: parseInt(query.inProgress),
        pending: parseInt(query.pending),
        highPriority: parseInt(query.highPriority),
      };
    } catch (error) {
      this.logError(error, 'getStats');
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.STATS_FAILED);
    }
  }

  async batchProcess(
    taskIds: string[],
    action: string,
    user: any,
  ): Promise<BatchProcessResultDto[]> {
    try {
      if (!Array.isArray(taskIds)) {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.INVALID_BATCH_INPUT);
      }

      if (taskIds.length === 0) {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.EMPTY_BATCH);
      }

      const results: BatchProcessResultDto[] = [];
      for (const taskId of taskIds) {
        const task = await this.validateTaskExists(taskId);

        if (!task) throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND);
        const canAccessTask = user.role === 'admin' || task.userId === user.id;
        if (!canAccessTask) {
          throw new UnauthorizedException('You cannot perform this action on this task');
        }
      }

      if (action === 'complete') {
        await this.tasksRepository.update({ id: In(taskIds) }, { status: TaskStatus.COMPLETED });

        for (const taskId of taskIds) {
          try {
            await this.handleTaskQueue(taskId, TaskStatus.COMPLETED);
            results.push({ taskId, success: true, result: { status: TaskStatus.COMPLETED } });
          } catch {
            results.push({ taskId, success: false, error: ERROR_MESSAGES.TASKS.QUEUE_ERROR });
          }
        }
      } else if (action === 'delete') {
        await this.tasksRepository.delete({ id: In(taskIds) });
        taskIds.forEach(taskId =>
          results.push({ taskId, success: true, result: { message: 'Task deleted' } }),
        );
      } else {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.INVALID_ACTION(action));
      }

      return results;
    } catch (error) {
      this.logError(error, `batchProcess(${action})`);

      if (error instanceof BadRequestException) throw error;

      return taskIds.map(taskId => ({
        taskId,
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.TASKS.BATCH_FAILED,
      }));
    }
  }

  private logError(error: unknown, context: string): void {
    if (error instanceof Error) {
      this.logger.error(`[${context}] ${error.message}`, error.stack);
    } else {
      this.logger.error(`[${context}] Unknown error occurred`);
    }
  }
}
