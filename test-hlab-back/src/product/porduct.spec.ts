import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ProductService } from './service/product.service';
import { ProductEntity } from './entities/product.entity';
import { ProductTranslationEntity } from './entities/product-translation.entity';
import { Connection } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import * as request from 'supertest';

interface ProductSearchResult {
  data: any;
  total: number;
  page: number;
  pageLimit: number;
}

describe('ProductService Integration', () => {
  let service: ProductService;
  let productRepo: Repository<ProductEntity>;
  let translationRepo: Repository<ProductTranslationEntity>;
  let connection: Connection;
  let product_id: number;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: parseInt(<string>process.env.POSTGRES_PORT),
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DATABASE,
          entities: [ProductEntity, ProductTranslationEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([ProductEntity, ProductTranslationEntity]),
      ],
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepo = module.get<Repository<ProductEntity>>(getRepositoryToken(ProductEntity));
    translationRepo = module.get<Repository<ProductTranslationEntity>>(getRepositoryToken(ProductTranslationEntity));
    connection = module.get<Connection>(Connection);
  });

  afterEach(async () => {
    if (product_id) {
      await service.delete(product_id);
    }
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should create and find products', async () => {
    try {
      const createProductDto = {
        name: { en: 'Product EN', th: 'สินค้า TH' },
        description: { en: 'Description EN', th: 'คำอธิบาย TH' },
      };
      await service.create(createProductDto);

      const searchProductDto = { name: 'Product', page: '1', pageLimit: '10' };
      const result: ProductSearchResult = await service.find(searchProductDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name.en).toEqual('Product EN');
      product_id = result.data[0].productId;
    } catch (error) {
      throw error;
    }
  });
});

describe('Product API (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let product_id: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(Connection);
    await app.init();
  });

  afterEach(async () => {
    if (product_id) {
      await request(app.getHttpServer()).delete(`/products/${product_id}`).expect(200);
    }
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    await app.close();
  });

  it('/create (POST)', async () => {
    try {
      const createProductDto = {
        name: { en: 'Product EN', th: 'สินค้า TH' },
        description: { en: 'Description EN', th: 'คำอธิบาย TH' },
      };

      const res = await request(app.getHttpServer()).post('/products').send(createProductDto).expect(201);

      expect(res.body.product_id).toBeDefined();
    } catch (error) {
      throw error;
    }
  });

  it('/find (GET)', async () => {
    try {
      const res = await request(app.getHttpServer()).get('/products').query({ name: 'Product EN', page: '1', pageLimit: '10' }).expect(200);
      expect(res.body).toHaveLength(1);
      product_id = res.body[0].productId;
    } catch (error) {
      throw error;
    }
  });
});
