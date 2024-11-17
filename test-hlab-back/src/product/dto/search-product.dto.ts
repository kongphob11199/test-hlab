import { IsNumberString, IsObject, IsOptional, IsString } from 'class-validator';

export class SearchProductDto {
  @IsObject()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageLimit?: string;
  //
}
