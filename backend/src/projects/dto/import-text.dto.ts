import { IsNotEmpty, IsString } from 'class-validator';

export class ImportTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
