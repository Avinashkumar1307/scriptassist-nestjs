import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
export interface Pagination<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    console.log('Creating task with DTO:', createTaskDto);
    return this.tasksRepository.manager.transaction(async (transactionalEntityManager) => {
      const task = this.tasksRepository.create(createTaskDto);
      const savedTask = await transactionalEntityManager.save(task);

      try {
        await this.taskQueue.add(
          'task-status-update',
          { taskId: savedTask.id, status: savedTask.status },
          { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        );
      } catch (error) {
        throw new InternalServerErrorException('Failed to queue task status update');
      }

      return savedTask;
    });
  }

  async findAll(filter: TaskFilterDto): Promise<Pagination<Task>> {
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

    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }
    if (userId) {
      query.andWhere('task.userId = :userId', { userId });
    }
    if (search) {
      query.andWhere('task.title ILIKE :search OR task.description ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (createdAfter) {
      query.andWhere('task.createdAt >= :createdAfter', { createdAfter });
    }
    if (createdBefore) {
      query.andWhere('task.createdAt <= :createdBefore', { createdBefore });
    }
    if (dueAfter) {
      query.andWhere('task.dueDate >= :dueAfter', { dueAfter });
    }
    if (dueBefore) {
      query.andWhere('task.dueDate <= :dueBefore', { dueBefore });
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    return this.tasksRepository.manager.transaction(async (transactionalEntityManager) => {
      const task = await this.findOne(id);
      const originalStatus = task.status;

      Object.assign(task, updateTaskDto);
      const updatedTask = await transactionalEntityManager.save(task);

      if (updateTaskDto.status && originalStatus !== updateTaskDto.status) {
        try {
          await this.taskQueue.add(
            'task-status-update',
            { taskId: updatedTask.id, status: updatedTask.status },
            { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
          );
        } catch (error) {
          throw new InternalServerErrorException('Failed to queue task status update');
        }
      }

      return updatedTask;
    });
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { status },
      relations: ['user'],
    });
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    return this.tasksRepository.save(task);
  }

  async getStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    highPriority: number;
  }> {
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
  }

  async batchProcess(
    taskIds: string[],
    action: string,
  ): Promise<Array<{ taskId: string; success: boolean; result?: any; error?: string }>> {
    const results: Array<{ taskId: string; success: boolean; result?: any; error?: string }> = [];
console.log('Batch processing tasks:', taskIds, 'Action:', action);
    // Ensure taskIds is an array
    if (!Array.isArray(taskIds)) {
      throw new Error('taskIds must be an array');
    }

    try {
      if (action === 'complete') {
        await this.tasksRepository.update(
          { id: In(taskIds) },
          { status: TaskStatus.COMPLETED },
        );
        for (const taskId of taskIds) {
          try {
            await this.taskQueue.add(
              'task-status-update',
              { taskId, status: TaskStatus.COMPLETED },
              { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
            );
            results.push({ taskId, success: true, result: { status: TaskStatus.COMPLETED } });
          } catch (error) {
            results.push({
              taskId,
              success: false,
              error: 'Failed to queue task status update',
            });
          }
        }
      } else if (action === 'delete') {
        await this.tasksRepository.delete({ id: In(taskIds) });
        for (const taskId of taskIds) {
          results.push({ taskId, success: true, result: { message: 'Task deleted' } });
        }
      } else {
        throw new NotFoundException(`Unknown action: ${action}`);
      }
    } catch (error) {
      for (const taskId of taskIds) {
        results.push({
          taskId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}