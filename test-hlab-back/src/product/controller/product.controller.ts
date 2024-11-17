import { Body, Controller, Delete, Get, Param, Post, Query, Res } from '@nestjs/common';
import { response, Response } from 'express';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductService } from '../service/product.service';
import { SearchProductDto } from '../dto/search-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Res() response: Response) {
    try {
      const data = await this.productService.create(createProductDto);
      return response.status(201).json(data);
    } catch (error) {
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  @Get()
  async find(@Query() searchProductDto: SearchProductDto, @Res() response: Response) {
    try {
      const { data, total, page, pageLimit } = await this.productService.find(searchProductDto);

      response.setHeader('X-Total-Count', total);
      response.setHeader('X-Page', page);
      response.setHeader('X-Page-Limit', pageLimit);

      return response.status(200).json(data);
    } catch (error) {
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.productService.delete(id);
    return { message: `Product with ID ${id} has been deleted successfully` };
  }
}
