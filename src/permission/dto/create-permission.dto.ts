import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PermissionType {
  MENU = 'MENU',
  BUTTON = 'BUTTON',
}

export class CreatePermissionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ enum: PermissionType })
  @IsNotEmpty()
  @IsEnum(PermissionType)
  type: PermissionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  redirect?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  layout?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  keepAlive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  show?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  order?: number;
} 