import { IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUsersDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  userIds: number[];
} 