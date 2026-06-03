import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderScenesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds: string[];
}
