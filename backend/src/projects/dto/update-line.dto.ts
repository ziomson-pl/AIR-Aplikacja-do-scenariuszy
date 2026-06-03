import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateLineDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @IsOptional()
  @IsString()
  parenthetical?: string | null;
}
