import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderLinesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds: string[];
}
