
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class TaskStatsDto {
  @ApiProperty({ example: 100, description: 'Total number of tasks' })
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({ example: 30, description: 'Number of completed tasks' })
  @IsInt()
  @Min(0)
  completed: number;

  @ApiProperty({ example: 20, description: 'Number of tasks in progress' })
  @IsInt()
  @Min(0)
  inProgress: number;

  @ApiProperty({ example: 50, description: 'Number of pending tasks' })
  @IsInt()
  @Min(0)
  pending: number;

  @ApiProperty({ example: 10, description: 'Number of high priority tasks' })
  @IsInt()
  @Min(0)
  highPriority: number;
}
