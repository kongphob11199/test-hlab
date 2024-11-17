import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { QueryRunner, Repository } from 'typeorm';
import { ProductTranslationEntity } from '../entities/product-translation.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { SearchProductDto } from '../dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity) private productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductTranslationEntity) private translationRepository: Repository<ProductTranslationEntity>
  ) {}

  async create(createProductDto: CreateProductDto) {
    const repo = this.productRepository;
    const transRepo = this.translationRepository;
    const product = await repo.save({});
    const translations = Object.entries(createProductDto.name).map(([lang, name]) => ({
      product,
      language_code: lang,
      name,
      description: createProductDto.description[lang],
    }));
    await transRepo.save(translations);
    return product;
  }

  async find(searchProductDto: SearchProductDto) {
    const { name, page = '1', pageLimit = '10' } = searchProductDto;

    const pageNumber = parseInt(page.toString(), 10);
    const pageLimitNumber = parseInt(pageLimit.toString(), 10);

    const queryBuilder = this.translationRepository
      .createQueryBuilder('translation')
      .leftJoinAndSelect('translation.product', 'product')
      .where('translation.name ILIKE :name', { name: `%${name || ''}%` })
      .orWhere(
        'translation.product.product_id IN (' +
          this.translationRepository
            .createQueryBuilder('subTranslation')
            .select('product.product_id')
            .leftJoin('subTranslation.product', 'product')
            .where('subTranslation.name ILIKE :name', { name: `%${name || ''}%` })
            .getQuery() +
          ')'
      );

    const translations = await queryBuilder.getMany();

    const grouped = translations.reduce((result, translation) => {
      const { product, language_code, name, description, created_at, update_at } = translation;

      if (!result[product.product_id]) {
        result[product.product_id] = {
          productId: product.product_id,
          name: {},
          description: {},
          createdAt: created_at,
          updateAt: update_at,
        };
      }

      result[product.product_id].name[language_code] = name;
      result[product.product_id].description[language_code] = description;

      return result;
    }, {});

    const groupedArray = Object.values(grouped);
    const resData = groupedArray.slice((pageNumber - 1) * pageLimitNumber, pageNumber * pageLimitNumber);
    const total = resData.length;

    return {
      data: resData,
      total,
      page: pageNumber,
      pageLimit: pageLimitNumber,
    };
  }

  async delete(productId: number): Promise<void> {
    const product = await this.productRepository.findOne({ where: { product_id: productId } });
    const translations = await this.translationRepository.find({ where: { product: { product_id: productId } } });

    if (!translations) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    await this.translationRepository.remove(translations);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    await this.productRepository.remove(product);
  }
}
