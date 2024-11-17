import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from '../service/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { SearchProductDto } from '../dto/search-product.dto';
import { Response } from 'express';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = {
    product_id: 1,
    created_at: new Date(),
    update_at: new Date(),
  };

  const mockProductResponse = {
    productId: 1,
    name: {
      th: 'ทดสอบ',
      en: 'Test',
    },
    description: {
      th: 'คำอธิบาย',
      en: 'Description',
    },
    createdAt: new Date(),
    updateAt: new Date(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockProductService = {
    create: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        name: {
          th: 'ทดสอบ',
          en: 'Test',
        },
        description: {
          th: 'คำอธิบาย',
          en: 'Description',
        },
      };

      mockProductService.create.mockResolvedValue(mockProduct);

      await controller.create(createProductDto, mockResponse);

      expect(service.create).toHaveBeenCalledWith(createProductDto);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw error if creation fails', async () => {
      const createProductDto: CreateProductDto = {
        name: {
          th: 'ทดสอบ',
          en: 'Test',
        },
        description: {
          th: 'คำอธิบาย',
          en: 'Description',
        },
      };

      mockProductService.create.mockRejectedValue(new Error('Creation failed'));

      await controller.create(createProductDto, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Creation failed',
      });
    });
  });

  describe('find', () => {
    it('should find products with pagination', async () => {
      const searchProductDto: SearchProductDto = {
        name: 'Test',
        page: '1',
        pageLimit: '20',
      };

      const mockPaginatedResponse = {
        data: [
          {
            productId: 1,
            name: { th: 'ทดสอบ', en: 'Test' },
            description: { th: 'คำอธิบาย', en: 'Description' },
            createdAt: new Date(),
            updateAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        pageLimit: 20,
      };

      mockProductService.find.mockResolvedValue(mockPaginatedResponse);

      await controller.find(searchProductDto, mockResponse);
      expect(service.find).toHaveBeenCalledWith(searchProductDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPaginatedResponse.data);
    });

    it('should return empty result when no products found', async () => {
      const searchProductDto: SearchProductDto = {
        name: 'NonExistent',
        page: '1',
        pageLimit: '10',
      };

      const mockEmptyResponse = {
        data: [],
        total: 1,
        page: 1,
        pageLimit: 10,
      };

      mockProductService.find.mockResolvedValue(mockEmptyResponse);

      await controller.find(searchProductDto, mockResponse);

      expect(service.find).toHaveBeenCalledWith(searchProductDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEmptyResponse.data);
    });

    it('should handle search with default pagination', async () => {
      const searchProductDto: SearchProductDto = {
        name: 'Test',
      };

      const mockPaginatedResponse = {
        data: [
          {
            productId: 1,
            name: { th: 'ทดสอบ', en: 'Test' },
            description: { th: 'คำอธิบาย', en: 'Description' },
            createdAt: new Date(),
            updateAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        pageLimit: 10,
      };

      mockProductService.find.mockResolvedValue(mockPaginatedResponse);

      await controller.find(searchProductDto, mockResponse);

      expect(service.find).toHaveBeenCalledWith(searchProductDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPaginatedResponse.data);
    });

    it('should handle error during search', async () => {
      const searchProductDto: SearchProductDto = {
        name: 'Test',
      };

      const error = new Error('Search failed');
      mockProductService.find.mockRejectedValue(error);

      await controller.find(searchProductDto, mockResponse);

      expect(service.find).toHaveBeenCalledWith(searchProductDto);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: error.message,
      });
    });
  });
});
