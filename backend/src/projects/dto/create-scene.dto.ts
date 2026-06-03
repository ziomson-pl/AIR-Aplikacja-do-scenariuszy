import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSceneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  heading: string;
}
