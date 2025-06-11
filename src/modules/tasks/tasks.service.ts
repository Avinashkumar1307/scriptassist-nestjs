import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
  BadRequestException,
  ConflictException,
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
import {TaskStatsDto} from './dto/response-stats.dto';
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
      this.logger.error(`Failed to queue task ${taskId} status update`, error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.QUEUE_ERROR);
    }
  }

  private async validateTaskExists(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!task) {
      throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND(id));
    }
    return task;
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

    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user');

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });
    if (userId) query.andWhere('task.userId = :userId', { userId });
    if (search) {
      query.andWhere('task.title ILIKE :search OR task.description ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (createdAfter) query.andWhere('task.createdAt >= :createdAfter', { createdAfter });
    if (createdBefore) query.andWhere('task.createdAt <= :createdBefore', { createdBefore });
    if (dueAfter) query.andWhere('task.dueDate >= :dueAfter', { dueAfter });
    if (dueBefore) query.andWhere('task.dueDate <= :dueBefore', { dueBefore });

    return { query, page, limit };
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

  async findAll(filter: TaskFilterDto): Promise<PaginationDto<Task>> {
    try {
      const pagegiven = filter.page ?? 1;
      const limitgiven = filter.limit ?? 10;
      if (pagegiven < 1 || limitgiven < 1) {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.INVALID_PAGINATION);
      }

      const cacheKey = `tasks:${JSON.stringify(filter)}`;
      const cachedResults = await this.cacheService.get<PaginationDto<Task>>(cacheKey);
      if (cachedResults) return cachedResults;

      const { query, page, limit } = this.buildTaskQuery(filter);
      const skip = (page - 1) * limit;
      
      const [data, total] = await query
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const result = {
        data,
        count: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      await this.cacheService.set(cacheKey, result, 60);
      return result;
    } catch (error) {
      this.logError(error, 'findAll');
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.FETCH_FAILED);
    }
  }

  async findOne(id: string): Promise<Task> {
    try {
      return await this.validateTaskExists(id);
    } catch (error) {
      this.logError(error, `findOne(${id})`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.FETCH_FAILED);
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    try {
      return await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
        const task = await this.validateTaskExists(id);
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
      
      if (error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) throw error;
          
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException(ERROR_MESSAGES.TASKS.CONFLICT);
      }
      
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const task = await this.validateTaskExists(id);
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
      
      if (error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) throw error;
      
      throw new InternalServerErrorException(ERROR_MESSAGES.TASKS.UPDATE_FAILED);
    }
  }

  async getStats(): Promise<TaskStatsDto> {
    try {
      const query = await this.tasksRepository
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
        })
        .getRawOne();

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

  async batchProcess(taskIds: string[], action: string): Promise<BatchProcessResultDto[]> {
    try {
      if (!Array.isArray(taskIds)) {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.INVALID_BATCH_INPUT);
      }

      if (taskIds.length === 0) {
        throw new BadRequestException(ERROR_MESSAGES.TASKS.EMPTY_BATCH);
      }

      const results: BatchProcessResultDto[] = [];

      if (action === 'complete') {
        await this.tasksRepository.update(
          { id: In(taskIds) },
          { status: TaskStatus.COMPLETED }
        );

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
        taskIds.forEach(taskId => results.push({ taskId, success: true, result: { message: 'Task deleted' } }));
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