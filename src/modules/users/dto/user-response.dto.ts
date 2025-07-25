import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'user' })
  role: string;

  @Expose()
  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  constructor(partial?: Partial<UserResponseDto>) {
    if (!partial) return; // Skip assignment if partial is undefined or null
    Object.assign(this, {
      id: partial.id,
      email: partial.email,
      name: partial.name,
      role: partial.role,
      createdAt: partial.createdAt ? new Date(partial.createdAt) : undefined,
      updatedAt: partial.updatedAt ? new Date(partial.updatedAt) : undefined,
    });
  }
}