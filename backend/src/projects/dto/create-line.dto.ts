import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LINE_TYPES, LineTypeValue } from '../screenplay.constants';

export class CreateLineDto {
  @IsOptional()
  @IsString()
  characterId?: string | null;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  parenthetical?: string | null;

  @IsIn(LINE_TYPES)
  type: LineTypeValue;
}
