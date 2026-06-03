import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateSceneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  heading: string;
}
