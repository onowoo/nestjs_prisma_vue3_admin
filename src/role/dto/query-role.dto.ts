import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryRoleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number;
} 