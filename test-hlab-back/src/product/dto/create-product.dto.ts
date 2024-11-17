import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateProductDto {
  @IsObject()
  @IsNotEmpty()
  name: {
    [langCode: string]: string;
  };

  @IsObject()
  @IsNotEmpty()
  description: {
    [langCode: string]: string;
  };
  
}
