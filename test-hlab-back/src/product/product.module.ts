import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductTranslationEntity } from './entities/product-translation.entity';
import { ProductService } from './service/product.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, ProductTranslationEntity])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
