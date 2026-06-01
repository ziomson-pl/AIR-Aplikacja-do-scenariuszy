import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LINE_TYPES, LineTypeValue } from '../screenplay.constants';

export class CreateLineDto {
  @IsOptional()
  @IsString()
  characterId?: string | null;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsIn(LINE_TYPES)
  type: LineTypeValue;
}
