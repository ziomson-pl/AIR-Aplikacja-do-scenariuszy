import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLineDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
