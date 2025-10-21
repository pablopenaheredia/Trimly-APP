import type { DatosReporte } from '../types/reportes.types';
import { API_URL } from '../../config/api';

export const reportesService = {
  async getReportes(periodoQuery: string) {
    const res = await fetch(`${API_URL}/reportes/completo?${periodoQuery}`);
    if (!res.ok) throw new Error('Error al obtener reportes');
    return await res.json(); // { resumen, servicios:[{id,nombre,cantidad,ingresos}], productos:[...] }
  },

  async getAllServicios() {
    // Activos para alimentar la lista base
    const res = await fetch(`${API_URL}/servicios/activos`);
    if (!res.ok) throw new Error('Error al obtener servicios');
    return await res.json(); // [{ id, servicio, precio, duracion }]
  },

  async getAllProductos() {
    // Ojo: el endpoint correcto es /producto
    const res = await fetch(`${API_URL}/producto`);
    if (!res.ok) throw new Error('Error al obtener productos');
    return await res.json(); // [{ id, nombre, precio, stock, ... }]
  }
};