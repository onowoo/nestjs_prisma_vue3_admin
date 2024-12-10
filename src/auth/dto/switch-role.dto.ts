import { IsNotEmpty, IsString } from 'class-validator';

export class SwitchRoleDto {
  @IsNotEmpty()
  @IsString()
  roleCode: string;
} 