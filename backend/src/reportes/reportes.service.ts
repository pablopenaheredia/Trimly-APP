import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from '../turnos/turno.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Servicio } from '../servicios/servicio.entity';
import { Producto } from '../producto/producto.entity';
import { Factura } from '../facturacion/factura.entity';
import { FacturaDetalle } from '../facturacion/factura-detalle.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Factura)
    private readonly facturaRepository: Repository<Factura>,
    @InjectRepository(FacturaDetalle)
    private readonly facturaDetalleRepository: Repository<FacturaDetalle>,
  ) {}

  async generarReporteCompleto(fechaInicio: string, fechaFin: string) {
    try {
      const [resumen, servicios, productos] = await Promise.all([
        this.obtenerResumenGeneral(fechaInicio, fechaFin),
        this.obtenerEstadisticasServicios(fechaInicio, fechaFin),
        this.obtenerEstadisticasProductos(fechaInicio, fechaFin),
      ]);

      return {
        resumen,
        servicios,
        productos,
        periodo: { fechaInicio, fechaFin },
      };
    } catch (error) {
      console.error('Error al generar reporte completo:', error);
      throw new Error('Error al generar el reporte completo');
    }
  }

  async obtenerResumenGeneral(fechaInicio: string, fechaFin: string) {
    try {
      // Usar consulta SQL directa con los nombres reales de las tablas
      const query = `
        SELECT
          COUNT(DISTINCT f.id) as total_turnos,
          COALESCE(SUM(fd.subtotal), 0) as ingresos_totales,
          COALESCE(SUM(CASE WHEN fd.tipo_item = 'servicio' THEN fd.cantidad ELSE 0 END), 0) as total_servicios,
          COALESCE(SUM(CASE WHEN fd.tipo_item = 'producto' THEN fd.cantidad ELSE 0 END), 0) as total_productos
        FROM factura f
        LEFT JOIN factura_detalle fd ON f.id = fd."facturaId"
        WHERE CAST(f."createdAt" AS DATE) BETWEEN $1 AND $2
      `;

      const result = await this.facturaRepository.query(query, [fechaInicio, fechaFin]);
      const row = result[0] || {};

      return {
        total_turnos: Number(row.total_turnos ?? 0),
        ingresos_totales: Number(row.ingresos_totales ?? 0),
        total_servicios: Number(row.total_servicios ?? 0),
        total_productos: Number(row.total_productos ?? 0),
      };
    } catch (error) {
      console.error('Error al obtener resumen general:', error);
      console.error('Detalles del error:', error.message);
      // Retornar valores por defecto en lugar de lanzar error
      return {
        total_turnos: 0,
        ingresos_totales: 0,
        total_servicios: 0,
        total_productos: 0,
      };
    }
  }

  async obtenerEstadisticasServicios(fechaInicio?: string, fechaFin?: string) {
    try {
      let query = `
        SELECT
          s.id,
          s.servicio as nombre,
          s.precio,
          COALESCE(SUM(fd.cantidad), 0) as cantidad,
          COALESCE(SUM(fd.subtotal), 0) as ingresos
        FROM servicio s
        INNER JOIN factura_detalle fd ON s.id = fd."itemId" AND fd.tipo_item = 'servicio'
        INNER JOIN factura f ON fd."facturaId" = f.id
      `;

      const params: any[] = [];

      if (fechaInicio && fechaFin) {
        query += ` WHERE CAST(f."createdAt" AS DATE) BETWEEN $1 AND $2`;
        params.push(fechaInicio, fechaFin);
      }

      query += ` GROUP BY s.id, s.servicio, s.precio ORDER BY ingresos DESC`;

      const result = await this.servicioRepository.query(query, params);

      return result.map((item: any) => ({
        id: Number(item.id),
        nombre: item.nombre || '',
        precio: Number(item.precio ?? 0),
        cantidad: Number(item.cantidad ?? 0),
        ingresos: Number(item.ingresos ?? 0),
      }));
    } catch (error) {
      console.error('Error al obtener estadísticas de servicios:', error);
      console.error('Detalles del error:', error.message);
      // Retornar array vacío en lugar de lanzar error
      return [];
    }
  }

async obtenerEstadisticasProductos(fechaInicio?: string, fechaFin?: string) {
  try {
    let query = `
      SELECT
        p.id,
        p.nombre,
        p.precio,
        p.stock,
        COALESCE(SUM(fd.cantidad), 0) as cantidad,
        COALESCE(SUM(fd.subtotal), 0) as ingresos
      FROM producto p
      INNER JOIN factura_detalle fd ON p.id = fd."itemId" AND fd.tipo_item = 'producto'
      INNER JOIN factura f ON fd."facturaId" = f.id
    `;

    const params: any[] = [];

    if (fechaInicio && fechaFin) {
      query += ` WHERE CAST(f."createdAt" AS DATE) BETWEEN $1 AND $2`;
      params.push(fechaInicio, fechaFin);
    }

    query += ` GROUP BY p.id, p.nombre, p.precio, p.stock ORDER BY ingresos DESC`;

    const result = await this.productoRepository.query(query, params);
    
    console.log('=== DEBUG PRODUCTOS ===');
    console.log('Número de productos encontrados:', result.length);
    if (result.length > 0) {
      console.log('Primer producto:', result[0]);
    }
    console.log('======================');

    return result.map((item: any) => ({
      id: Number(item.id),
      nombre: item.nombre || '',
      precio: Number(item.precio ?? 0),
      stock: item.stock !== null ? Number(item.stock) : 0,
      cantidad: Number(item.cantidad ?? 0),
      ingresos: Number(item.ingresos ?? 0),
    }));
  } catch (error) {
    console.error('Error al obtener estadísticas de productos:', error);
    console.error('Detalles del error:', error.message);
    // Retornar array vacío en lugar de lanzar error
    return [];
  }
}

  async obtenerFacturacionPorPeriodo(fechaInicio: string, fechaFin: string) {
    try {
      const query = `
        SELECT 
          CAST(f."createdAt" AS DATE) as fecha,
          COALESCE(SUM(fd.subtotal), 0) as total
        FROM factura f
        LEFT JOIN factura_detalle fd ON f.id = fd."facturaId"
        WHERE CAST(f."createdAt" AS DATE) BETWEEN $1 AND $2
        GROUP BY CAST(f."createdAt" AS DATE)
        ORDER BY fecha ASC
      `;

      return await this.facturaRepository.query(query, [fechaInicio, fechaFin]);
    } catch (error) {
      console.error('Error al obtener facturación por período:', error);
      throw new Error('Error al obtener facturación por período');
    }
  }
}