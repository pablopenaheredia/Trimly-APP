import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFacturaDetalleDto {
  @IsEnum(['servicio', 'producto'])
  tipo_item: 'servicio' | 'producto';

  @IsNumber()
  itemId: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precioUnitario: number;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  turnoId?: number;

  @IsOptional()
  @IsString()
  nota?: string;
}

export class CreateFacturaDto {
  @IsNumber()
  clienteId: number;

  @IsOptional()
  @IsEnum(['pendiente', 'cobrada', 'cancelada'])
  estado?: 'pendiente' | 'cobrada' | 'cancelada';

  @IsString()
  metodoPago: string;

  @ValidateNested({ each: true })
  @Type(() => CreateFacturaDetalleDto)
  detalles: CreateFacturaDetalleDto[];
}
