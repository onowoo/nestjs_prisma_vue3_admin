import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionType } from './create-permission.dto';

export class QueryPermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PermissionType)
  type?: PermissionType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number;
} 