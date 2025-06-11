// pagination.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto<T> {
  @ApiProperty({ description: 'List of data items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object) // Use the appropriate class for T if known
  data: T[];

  @ApiProperty({ example: 100, description: 'Total number of items' })
  @IsInt()
  @Min(0)
  count: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  @IsInt()
  @Min(1)
  limit: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  @IsInt()
  @Min(1)
  totalPages: number;

  constructor(data: T[], count: number, page: number, limit: number, totalPages: number) {
    this.data = data;
    this.count = count;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
  }
}
