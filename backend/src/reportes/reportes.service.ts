import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
      // Obtener facturas del período con sus detalles
      const facturas = await this.facturaRepository.find({
        where: {
          createdAt: Between(new Date(fechaInicio), new Date(fechaFin + 'T23:59:59')),
        },
        relations: ['detalles'],
      });

      let ingresos_totales = 0;
      let total_servicios = 0;
      let total_productos = 0;

      facturas.forEach(factura => {
        factura.detalles?.forEach(detalle => {
          ingresos_totales += Number(detalle.subtotal) || 0;
          if (detalle.tipo_item === 'servicio') {
            total_servicios += Number(detalle.cantidad) || 0;
          } else if (detalle.tipo_item === 'producto') {
            total_productos += Number(detalle.cantidad) || 0;
          }
        });
      });

      return {
        total_turnos: facturas.length,
        ingresos_totales,
        total_servicios,
        total_productos,
      };
    } catch (error) {
      console.error('Error al obtener resumen general:', error);
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
      // Obtener todos los servicios
      const todosServicios = await this.servicioRepository.find();
      
      // Obtener detalles de facturas del período para servicios
      let detallesServicios: FacturaDetalle[] = [];
      
      if (fechaInicio && fechaFin) {
        const facturas = await this.facturaRepository.find({
          where: {
            createdAt: Between(new Date(fechaInicio), new Date(fechaFin + 'T23:59:59')),
          },
          relations: ['detalles'],
        });
        
        facturas.forEach(factura => {
          factura.detalles?.forEach(detalle => {
            if (detalle.tipo_item === 'servicio') {
              detallesServicios.push(detalle);
            }
          });
        });
      }

      // Mapear servicios con sus estadísticas
      return todosServicios.map(servicio => {
        const detallesDelServicio = detallesServicios.filter(d => d.itemId === servicio.id);
        const cantidad = detallesDelServicio.reduce((sum, d) => sum + (Number(d.cantidad) || 0), 0);
        const ingresos = detallesDelServicio.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);

        return {
          id: servicio.id,
          nombre: servicio.servicio || '',
          precio: Number(servicio.precio) || 0,
          cantidad,
          ingresos,
        };
      }).sort((a, b) => b.ingresos - a.ingresos);
    } catch (error) {
      console.error('Error al obtener estadísticas de servicios:', error);
      return [];
    }
  }

  async obtenerEstadisticasProductos(fechaInicio?: string, fechaFin?: string) {
    try {
      // Obtener todos los productos
      const todosProductos = await this.productoRepository.find();
      console.log('Total productos en BD:', todosProductos.length);
      
      // Obtener detalles de facturas del período para productos
      let detallesProductos: FacturaDetalle[] = [];
      
      if (fechaInicio && fechaFin) {
        const facturas = await this.facturaRepository.find({
          where: {
            createdAt: Between(new Date(fechaInicio), new Date(fechaFin + 'T23:59:59')),
          },
          relations: ['detalles'],
        });
        
        console.log('Facturas encontradas:', facturas.length);
        
        facturas.forEach(factura => {
          console.log('Factura ID:', factura.id, 'Detalles:', factura.detalles?.length || 0);
          factura.detalles?.forEach(detalle => {
            console.log('Detalle - tipo_item:', detalle.tipo_item, 'itemId:', detalle.itemId, 'cantidad:', detalle.cantidad);
            if (detalle.tipo_item === 'producto') {
              detallesProductos.push(detalle);
            }
          });
        });
      }
      
      console.log('Detalles de productos encontrados:', detallesProductos.length);

      // Mapear productos con sus estadísticas
      return todosProductos.map(producto => {
        const detallesDelProducto = detallesProductos.filter(d => d.itemId === producto.id);
        const cantidad = detallesDelProducto.reduce((sum, d) => sum + (Number(d.cantidad) || 0), 0);
        const ingresos = detallesDelProducto.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);

        return {
          id: producto.id,
          nombre: producto.nombre || '',
          precio: Number(producto.precio) || 0,
          stock: producto.stock !== null ? Number(producto.stock) : 0,
          cantidad,
          ingresos,
        };
      }).sort((a, b) => b.ingresos - a.ingresos);
    } catch (error) {
      console.error('Error al obtener estadísticas de productos:', error);
      return [];
    }
  }

  async obtenerFacturacionPorPeriodo(fechaInicio: string, fechaFin: string) {
    try {
      const facturas = await this.facturaRepository.find({
        where: {
          createdAt: Between(new Date(fechaInicio), new Date(fechaFin + 'T23:59:59')),
        },
        relations: ['detalles'],
      });

      // Agrupar por fecha
      const porFecha: { [key: string]: number } = {};
      
      facturas.forEach(factura => {
        const fecha = factura.createdAt.toISOString().split('T')[0];
        if (!porFecha[fecha]) {
          porFecha[fecha] = 0;
        }
        factura.detalles?.forEach(detalle => {
          porFecha[fecha] += Number(detalle.subtotal) || 0;
        });
      });

      return Object.entries(porFecha)
        .map(([fecha, total]) => ({ fecha, total }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
    } catch (error) {
      console.error('Error al obtener facturación por período:', error);
      throw new Error('Error al obtener facturación por período');
    }
  }
}
