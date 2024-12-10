import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  enable?: boolean;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number;
} 