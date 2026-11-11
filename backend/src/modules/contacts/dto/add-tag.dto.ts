import { IsString, IsNotEmpty } from 'class-validator';

export class AddTagDto {
  @IsString()
  @IsNotEmpty()
  tag: string;
}
