// batch-process-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class BatchProcessResultDto {
  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440004', description: 'The ID of the task' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: true, description: 'Indicates if the operation was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'The result of the operation', required: false })
  @IsOptional()
  result?: any;

  @ApiProperty({ example: 'An error occurred', description: 'Error message if the operation failed', required: false })
  @IsString()
  @IsOptional()
  error?: string;
}
