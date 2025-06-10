import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { TasksService } from '../../modules/tasks/tasks.service';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';

@Injectable()
@Processor('task-processing')
export class TaskProcessorService {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly configService: ConfigService,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  @Process('task-status-update')
  async handleStatusUpdate(
    job: Job<{ taskId: string; status: string }>,
  ): Promise<{ data: { success: boolean; taskId: string; newStatus?: string; error?: string } }> {
    const { taskId, status } = job.data;
    const jobStatus = `Job ${this.id(job.id)} ${job.name}`;
    this.logger.debug(`Processing ${jobStatus}`);

    if (!taskId || !Object.values(TaskStatus).includes(status as TaskStatus)) {
      this.logger.warn(`${jobStatus} failed: Invalid taskId or status`);
      return { data: { success: false, taskId, error: 'Invalid taskId or status' } };
    }

    try {
      const task = await this.tasksService.updateStatus(taskId, status as TaskStatus);
      this.logger.debug(`${jobStatus} completed: Task ${taskId} updated to ${status}`);
      return {
        data: {
          success: true,
          taskId: task.id,
          newStatus: task.status,
        },
      };
    } catch (error: any) {
      this.logger.error(`${jobStatus} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('overdue-tasks-notification')
  async handleOverdueTasks(
    job: Job,
  ): Promise<{ data: { success: boolean; processed: number; message?: string; error?: string } }> {
    const jobStatus = `Job ${this.id(job.id)} ${job.name}`;
    this.logger.debug(`Processing ${jobStatus}`);

    const batchSize = this.configService.get<number>('bull.batchSize', 100);
    let processed = 0;

    try {
      const now = new Date();
      const query = this.taskRepository
        .createQueryBuilder('task')
        .where('task.dueDate < :now', { now })
        .andWhere('task.status != :completed', { completed: TaskStatus.COMPLETED })
        .select(['task.id', 'task.userId', 'task.title', 'task.dueDate']);

      const stream = await query.stream();

      let batch: Task[] = [];
      for await (const task of stream) {
        batch.push(task);
        if (batch.length >= batchSize) {
          await this.notifyOverdueBatch(batch);
          processed += batch.length;
          batch = [];
        }
      }

      if (batch.length > 0) {
        await this.notifyOverdueBatch(batch);
        processed += batch.length;
      }

      this.logger.log(`${jobStatus} completed: Processed ${processed} overdue tasks`);
      return {
        data: {
          success: true,
          processed,
          message: `Processed ${processed} overdue tasks`,
        },
      };
    } catch (error: any) {
      this.logger.error(`${jobStatus} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async notifyOverdueBatch(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      this.logger.debug(
        `Notifying user ${task.userId} about overdue task ${task.id}: ${task.title}`,
      );
    }
  }

  private id(id: string | number | undefined): string {
    return String(id ?? '[no id]');
  }
}
