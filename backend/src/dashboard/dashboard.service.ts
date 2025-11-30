import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Turno } from '../turnos/turno.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Producto } from '../producto/producto.entity';
import { Factura } from '../facturacion/factura.entity';
import { FacturaDetalle } from '../facturacion/factura-detalle.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Factura)
    private facturaRepository: Repository<Factura>,
    @InjectRepository(FacturaDetalle)
    private facturaDetalleRepository: Repository<FacturaDetalle>,
  ) {}

  async obtenerMetricasDashboard() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyStr = hoy.toISOString().split('T')[0];

    // Obtener inicio de semana (Domingo)
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];

    // Obtener fin de semana (Sábado)
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    const finSemanaStr = finSemana.toISOString().split('T')[0];

    // Obtener semana anterior para cálculo de crecimiento
    const inicioSemanaPrev = new Date(inicioSemana);
    inicioSemanaPrev.setDate(inicioSemana.getDate() - 7);
    inicioSemanaPrev.setHours(0, 0, 0, 0);
    const finSemanaPrev = new Date(inicioSemana);
    finSemanaPrev.setDate(inicioSemana.getDate() - 1);
    finSemanaPrev.setHours(23, 59, 59, 999);

    // Turnos de hoy
    const turnosHoy = await this.turnoRepository.find({
      where: { fecha: hoyStr },
      relations: ['servicio'],
    });

    // Filtrar turnos que no estén cancelados
    const turnosActivos = turnosHoy.filter((t) => t.estado !== 'cancelado');

    const totalTurnosHoy = turnosActivos.length;
    const turnosCompletados = turnosActivos.filter(
      (t) => t.estado === 'cobrado',
    ).length;
    const turnosPendientes = turnosActivos.filter(
      (t) => t.estado === 'pendiente',
    ).length;

    // Ingresos de hoy basados en facturas cobradas
    const inicioDelDia = new Date(hoy);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(hoy);
    finDelDia.setHours(23, 59, 59, 999);

    const facturasHoy = await this.facturaRepository.find({
      where: {
        estado: 'cobrada',
        createdAt: Between(inicioDelDia, finDelDia),
      },
      relations: ['detalles'],
    });

    const ingresosHoy = facturasHoy.reduce((total, factura) => {
      const totalFactura = factura.detalles.reduce(
        (sum, detalle) => sum + Number(detalle.subtotal),
        0,
      );
      return total + totalFactura;
    }, 0);

    // Objetivo diario (puede ser configurable)
    const objetivoDiario = 35000;
    const porcentajeCumplimiento = (ingresosHoy / objetivoDiario) * 100;

    // Clientes atendidos HOY (del día actual)
    // Clientes únicos atendidos (facturados) en el día
    const clientesIdsAtendidosHoy = [
      ...new Set(facturasHoy.map((f) => f.clienteId)),
    ];
    const clientesAtendidosHoy = clientesIdsAtendidosHoy.length;

    // Total de facturas del día
    const clientesFacturadosHoy = facturasHoy.length;

    // Resumen semanal
    const turnosSemana = await this.turnoRepository.find({
      where: {
        fecha: Between(inicioSemanaStr, finSemanaStr),
      },
      relations: ['servicio'],
    });

    // Filtrar turnos que no estén cancelados
    const turnosActivosSemana = turnosSemana.filter((t) => t.estado !== 'cancelado');
    const totalTurnosSemana = turnosActivosSemana.length;

    // Ingresos semanales basados en facturas cobradas
    const facturasSemanaCobradas = await this.facturaRepository.find({
      where: {
        estado: 'cobrada',
        createdAt: Between(inicioSemana, finSemana),
      },
      relations: ['detalles'],
    });

    const ingresosSemana = facturasSemanaCobradas.reduce((total, factura) => {
      const totalFactura = factura.detalles.reduce(
        (sum, detalle) => sum + Number(detalle.subtotal),
        0,
      );
      return total + totalFactura;
    }, 0);

    // Contar servicios y productos facturados en la semana
    const detallesSemana = facturasSemanaCobradas.flatMap((f) => f.detalles);
    const cantidadServicios = detallesSemana
      .filter((d) => d.tipo_item === 'servicio')
      .reduce((sum, d) => sum + d.cantidad, 0);
    const cantidadProductos = detallesSemana
      .filter((d) => d.tipo_item === 'producto')
      .reduce((sum, d) => sum + d.cantidad, 0);

    // Calcular crecimiento semanal basado en facturas
    const facturasSemanaPrev = await this.facturaRepository.find({
      where: {
        estado: 'cobrada',
        createdAt: Between(inicioSemanaPrev, finSemanaPrev),
      },
      relations: ['detalles'],
    });

    const ingresosSemanaAnterior = facturasSemanaPrev.reduce((total, factura) => {
      const totalFactura = factura.detalles.reduce(
        (sum, detalle) => sum + Number(detalle.subtotal),
        0,
      );
      return total + totalFactura;
    }, 0);

    const crecimientoSemanal =
      ingresosSemanaAnterior > 0
        ? ((ingresosSemana - ingresosSemanaAnterior) / ingresosSemanaAnterior) *
          100
        : 0;

    return {
      turnosHoy: {
        total: totalTurnosHoy,
        completados: turnosCompletados,
        pendientes: turnosPendientes,
      },
      ingresosHoy: {
        monto: ingresosHoy,
        objetivo: objetivoDiario,
        porcentaje: Math.round(porcentajeCumplimiento),
      },
      clientesHoy: {
        total: clientesAtendidosHoy,
        atendidos: clientesAtendidosHoy,
        facturados: clientesFacturadosHoy,
      },
      resumenSemanal: {
        ingresos: ingresosSemana,
        turnos: totalTurnosSemana,
        servicios: cantidadServicios,
        productos: cantidadProductos,
        crecimiento: Math.round(crecimientoSemanal),
      },
    };
  }

  async obtenerProximosTurnos() {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    const horaActual = hoy.toTimeString().split(' ')[0].slice(0, 5);

    // Calcular hora límite (1 hora antes)
    const horaLimite = new Date(hoy);
    horaLimite.setHours(horaLimite.getHours() - 1);
    const horaLimiteStr = horaLimite.toTimeString().split(' ')[0].slice(0, 5);

    const turnosHoy = await this.turnoRepository.find({
      where: { fecha: hoyStr },
      relations: ['cliente', 'servicio'],
      order: { hora: 'ASC' },
    });

    // Filtrar turnos no atendidos desde 1 hora antes
    const proximosTurnos = turnosHoy
      .filter((t) => {
        const estadoValido = t.estado === 'pendiente';
        const horaValida = t.hora >= horaLimiteStr;
        return estadoValido && horaValida;
      })
      .slice(0, 5); // Mostrar hasta 5 turnos

    return proximosTurnos.map((turno) => ({
      id: turno.id,
      cliente: {
        nombre: `${turno.cliente.nombre} ${turno.cliente.apellido}`,
      },
      servicio: turno.servicio?.servicio || 'Sin servicio',
      hora: turno.hora,
      estado: turno.estado,
    }));
  }

  async obtenerNotificaciones() {
    const productosStockBajo = await this.productoRepository.find({
      where: {
      },
    });

    const productosCriticos = productosStockBajo
      .filter((p) => p.stock < 5)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        stock: p.stock,
      }));

    // Servicios sin pagar (turnos con estado pendiente que ya pasaron)
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    const turnosSinPagar = await this.turnoRepository.find({
      where: { estado: 'pendiente' },
      relations: ['cliente', 'servicio'],
      order: { fecha: 'DESC' },
    });

    // Filtrar turnos que están en el pasado
    const serviciosSinPagar = turnosSinPagar
      .filter((t) => t.fecha < hoyStr)
      .map((turno) => {
        const fechaTurno = new Date(turno.fecha);
        const diferenciaHora = Math.abs(hoy.getTime() - fechaTurno.getTime());
        const diferenciaDias = Math.ceil(diferenciaHora / (1000 * 60 * 60 * 24));

        let fechaRelativa = '';
        if (diferenciaDias === 0) {
          fechaRelativa = 'hoy';
        } else if (diferenciaDias === 1) {
          fechaRelativa = 'ayer';
        } else {
          fechaRelativa = `hace ${diferenciaDias} días`;
        }

        return {
          id: turno.id,
          cliente: `${turno.cliente.nombre} ${turno.cliente.apellido}`,
          monto: turno.servicio?.precio || 0,
          fecha: turno.fecha,
          fechaRelativa,
        };
      });

    return {
      stockBajo: {
        cantidad: productosCriticos.length,
        productos: productosCriticos,
      },
      serviciosSinPagar: {
        cantidad: serviciosSinPagar.length,
        servicios: serviciosSinPagar,
      },
    };
  }
}
