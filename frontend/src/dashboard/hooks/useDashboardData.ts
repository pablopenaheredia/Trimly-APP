import { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

interface MetricasDashboard {
  turnosHoy: {
    total: number;
    completados: number;
    pendientes: number;
  };
  ingresosHoy: {
    monto: number;
    objetivo: number;
    porcentaje: number;
  };
  clientesHoy: {
    total: number;
    atendidos: number;
    facturados: number;
  };
  resumenSemanal: {
    ingresos: number;
    turnos: number;
    servicios: number;
    productos: number;
    crecimiento: number;
  };
}

interface ProximoTurno {
  id: number;
  cliente: {
    nombre: string;
  };
  servicio: string;
  hora: string;
  estado: 'pendiente' | 'cobrado' | 'cancelado';
}

interface Notificaciones {
  stockBajo: {
    cantidad: number;
    productos: Array<{
      id: number;
      nombre: string;
      stock: number;
    }>;
  };
  serviciosSinPagar: {
    cantidad: number;
    servicios: Array<{
      id: number;
      cliente: string;
      monto: number;
      fecha: string;
      fechaRelativa: string;
    }>;
  };
}

export const useDashboardData = () => {
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [proximosTurnos, setProximosTurnos] = useState<ProximoTurno[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificaciones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const obtenerDatosDashboard = async () => {
    try {
      setCargando(true);
      const [respuestaMetricas, respuestaTurnos, respuestaNotificaciones] = await Promise.all([
        fetch(`${API_URL}/dashboard/metrics`),
        fetch(`${API_URL}/dashboard/upcoming-turnos`),
        fetch(`${API_URL}/dashboard/notifications`),
      ]);

      if (!respuestaMetricas.ok || !respuestaTurnos.ok || !respuestaNotificaciones.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }

      const datosMetricas = await respuestaMetricas.json();
      const datosTurnos = await respuestaTurnos.json();
      const datosNotificaciones = await respuestaNotificaciones.json();

      setMetricas(datosMetricas);
      setProximosTurnos(datosTurnos);
      setNotificaciones(datosNotificaciones);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerDatosDashboard();
  }, []);

  return { metricas, proximosTurnos, notificaciones, cargando, error, recargar: obtenerDatosDashboard };
};
