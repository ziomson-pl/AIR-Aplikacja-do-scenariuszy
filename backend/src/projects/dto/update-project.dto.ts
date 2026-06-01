import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;
}
