import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('product_translations')
@Unique(['product', 'language_code'])
export class ProductTranslationEntity {
  @PrimaryGeneratedColumn()
  translation_id: number;

  @ManyToOne(() => ProductEntity, (product) => product.product_id)
  @Index()
  product: ProductEntity;

  @Column({ length: 2 })
  @Index()
  language_code: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  update_at: Date;
}
