import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { ProductEntity } from '../entities/product.entity';
import { ProductTranslationEntity } from '../entities/product-translation.entity';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: Repository<ProductEntity>;
  let translationRepository: Repository<ProductTranslationEntity>;

  const mockProduct = {
    product_id: 1,
    created_at: new Date(),
    update_at: new Date(),
  };

  const mockTranslations = [
    {
      translation_id: 1,
      product: mockProduct,
      language_code: 'th',
      name: 'ทดสอบ',
      description: 'คำอธิบาย',
      created_at: new Date(),
      update_at: new Date(),
    },
    {
      translation_id: 2,
      product: mockProduct,
      language_code: 'en',
      name: 'Test',
      description: 'Description',
      created_at: new Date(),
      update_at: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: {
            save: jest.fn().mockResolvedValue(mockProduct),
          },
        },
        {
          provide: getRepositoryToken(ProductTranslationEntity),
          useValue: {
            save: jest.fn().mockResolvedValue(mockTranslations),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockTranslations),
              select: jest.fn().mockReturnThis(),
              leftJoin: jest.fn().mockReturnThis(),
              getQuery: jest.fn().mockReturnValue('SELECT product.product_id FROM product'),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<Repository<ProductEntity>>(getRepositoryToken(ProductEntity));
    translationRepository = module.get<Repository<ProductTranslationEntity>>(getRepositoryToken(ProductTranslationEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with translations', async () => {
      const createProductDto = {
        name: {
          th: 'ทดสอบ',
          en: 'Test',
        },
        description: {
          th: 'คำอธิบาย',
          en: 'Description',
        },
      };

      const result = await service.create(createProductDto);

      expect(productRepository.save).toHaveBeenCalled();
      expect(translationRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            language_code: 'th',
            name: 'ทดสอบ',
            description: 'คำอธิบาย',
          }),
          expect.objectContaining({
            language_code: 'en',
            name: 'Test',
            description: 'Description',
          }),
        ])
      );
      expect(result).toEqual(mockProduct);
    });
  });

  describe('find', () => {
    it('should find products with pagination', async () => {
      const searchProductDto = {
        name: 'Test',
        page: '1',
        pageLimit: '20',
      };

      const result = await service.find(searchProductDto);

      expect(translationRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        data: [
          {
            productId: 1,
            name: {
              th: 'ทดสอบ',
              en: 'Test',
            },
            description: {
              th: 'คำอธิบาย',
              en: 'Description',
            },
            createdAt: expect.any(Date),
            updateAt: expect.any(Date),
          },
        ],
        total: 1,
        page: 1,
        pageLimit: 20,
      });
    });

    it('should handle empty search results', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT product.product_id FROM product'),
      };

      jest.spyOn(translationRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const searchProductDto = {
        name: 'NonExistent',
        page: '1',
        pageLimit: '10',
      };

      const result = await service.find(searchProductDto);

      expect(translationRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageLimit: 10,
      });
    });

    it('should handle default pagination values', async () => {
      const searchProductDto = {
        name: 'Test',
      };

      const result = await service.find(searchProductDto);

      expect(result.page).toBe(1);
      expect(result.pageLimit).toBe(10);
    });
  });
});
