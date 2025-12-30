// Archivo: backend/src/clientes/historial-cliente.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from '../turnos/turno.entity';
import { Factura } from '../facturacion/factura.entity';
import { FacturaDetalle } from '../facturacion/factura-detalle.entity';

@Injectable()
export class HistorialClienteService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepo: Repository<Turno>,
    @InjectRepository(Factura)
    private facturaRepo: Repository<Factura>,
    @InjectRepository(FacturaDetalle)
    private facturaDetalleRepo: Repository<FacturaDetalle>,
  ) {}

  async obtenerTurnosCliente(clienteId: number) {
    return this.turnoRepo.find({
      where: { clienteId },
      relations: ['cliente', 'servicio', 'usuario', 'productos'],
      order: { fecha: 'DESC' },
    });
  }

  async obtenerFacturasCliente(clienteId: number) {
    return this.facturaRepo.find({
      where: { clienteId },
      relations: ['detalles', 'cliente'],
      order: { createdAt: 'DESC' },
    });
  }
}
