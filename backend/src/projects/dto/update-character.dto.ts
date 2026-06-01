import { IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
