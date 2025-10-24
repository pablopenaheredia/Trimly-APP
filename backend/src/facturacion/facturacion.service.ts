import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Factura } from './factura.entity';
import { FacturaDetalle } from './factura-detalle.entity';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { Turno } from '../turnos/turno.entity';
import { Producto } from '../producto/producto.entity';
import { Servicio } from '../servicios/servicio.entity';

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(Factura)
    private facturaRepo: Repository<Factura>,
    @InjectRepository(FacturaDetalle)
    private detalleRepo: Repository<FacturaDetalle>,
    @InjectRepository(Turno)
    private turnoRepo: Repository<Turno>,
    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,
    @InjectRepository(Servicio)
    private servicioRepo: Repository<Servicio>,
  ) {}

  async finalizarFactura(dto: CreateFacturaDto) {
    // 1. Crear factura
    const factura = this.facturaRepo.create({
      clienteId: dto.clienteId,
      estado: 'cobrada',
      metodoPago: dto.metodoPago,
    });
    await this.facturaRepo.save(factura);

    // 2. Crear y asociar detalles
    const detallesGuardados: FacturaDetalle[] = [];
    for (const item of dto.detalles) {
      const detalle = this.detalleRepo.create({
        facturaId: factura.id,
        tipo_item: item.tipo_item,
        itemId: item.itemId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        turnoId: item.turnoId, // ✅ Guardar turnoId en el detalle
      });
      const savedDetalle = await this.detalleRepo.save(detalle);
      detallesGuardados.push(savedDetalle);

      // Si es producto, descuenta stock
      if (item.tipo_item === 'producto') {
        await this.productoRepo.decrement(
          { id: item.itemId },
          'stock',
          item.cantidad,
        );
      }

      // Si es servicio, suma al contador de realizados
      if (item.tipo_item === 'servicio') {
        if (item.turnoId) {
          const turno = await this.turnoRepo.findOne({
            where: { id: item.turnoId },
          });
          if (turno) {
            await this.servicioRepo.increment(
              { id: turno.servicioId },
              'realizados',
              item.cantidad,
            );
          }
        } else {
          await this.servicioRepo.increment(
            { id: item.itemId },
            'realizados',
            item.cantidad,
          );
        }
      }
    }

    // 3. Cambiar estado de turno a cobrado y asociar factura
    for (const item of dto.detalles) {
      if (item.tipo_item === 'servicio' && item.turnoId) {
        const turno = await this.turnoRepo.findOne({
          where: { id: item.turnoId },
        });
        if (turno) {
          turno.estado = 'cobrado';
          turno.factura = factura; // ✅ Asociar la factura con el turno
          
          // ✅ Actualizar la nota del turno si viene en el payload
          if (item.nota !== undefined) {
            turno.notas = item.nota;
          }
          
          await this.turnoRepo.save(turno);
        }
      }
    }

    // 4. Devolver la factura con los detalles completos
    factura.detalles = detallesGuardados;
    return factura;
  }
}
