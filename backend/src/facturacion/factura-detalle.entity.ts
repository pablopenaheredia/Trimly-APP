import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Factura } from './factura.entity';

@Entity()
export class FacturaDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Factura, factura => factura.detalles)
  factura: Factura;

  @Column()
  facturaId: number;

  @Column({ type: 'enum', enum: ['servicio', 'producto'] })
  tipo_item: 'servicio' | 'producto';

  @Column()
  itemId: number;

  @Column()
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precioUnitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ nullable: true })
  turnoId?: number;
}