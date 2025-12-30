// frontend/src/clientes/HistorialClienteModal.tsx
import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaUser,
  FaSort,
  FaPhone,
  FaEnvelope,
  FaCut,
  FaBox,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { formatFullName } from "../utils/nameFormat";
import "./HistorialClienteModal.css";
import { API_URL } from "../config/api";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  fechaNacimiento?: string;
  ultimaVisita?: string;
  visitas?: number;
  activo?: boolean;
}

interface TurnoHistorial {
  id: number;
  fecha: string;
  hora: string;
  servicio: {
    id: number;
    servicio: string;
    precio: number;
  };
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  productos?: Array<{
    id: number;
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    producto?: {
      id: number;
      nombre: string;
      precio: number;
    };
  }>;
  notas?: string;
  estado: string;
}

interface FacturaDetalle {
  id: number;
  tipo_item: "producto" | "servicio";
  itemId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  turnoId?: number;
}

interface FacturaHistorial {
  id: number;
  metodoPago: string;
  estado: string;
  createdAt: string;
  detalles: FacturaDetalle[];
}

// Estructura para el historial combinado como en v0
interface ServicioHistorial {
  fecha: string;
  servicio: string;
  profesional: string;
  productos: string[];
  nota: string;
  monto: number;
}

interface Props {
  show: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

type UsuarioOption = {
  id: number;
  nombre: string;
  apellido: string;
  activo?: boolean;
  rol?: "admin" | "empleado";
};

type ProductoOption = {
  id: number;
  nombre: string;
  precio: number;
};

const HistorialClienteModal: React.FC<Props> = ({ show, onClose, cliente }) => {
  const [activeTab, setActiveTab] = useState<"servicios" | "datos">(
    "servicios"
  );
  const [turnos, setTurnos] = useState<TurnoHistorial[]>([]);
  const [facturas, setFacturas] = useState<FacturaHistorial[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [showAddTurno, setShowAddTurno] = useState(false);
  const [usuariosOptions, setUsuariosOptions] = useState<UsuarioOption[]>([]);
  const [addTurnoLoading, setAddTurnoLoading] = useState(false);
  const [addTurnoError, setAddTurnoError] = useState<string>("");
  const [nuevoTurnoFecha, setNuevoTurnoFecha] = useState<string>("");
  const [nuevoTurnoHora, setNuevoTurnoHora] = useState<string>("");
  const [nuevoTurnoServicioId, setNuevoTurnoServicioId] = useState<string>("");
  const [nuevoTurnoUsuarioId, setNuevoTurnoUsuarioId] = useState<string>("");
  const [nuevoTurnoNotas, setNuevoTurnoNotas] = useState<string>("");
  const [nuevoTurnoProductoId, setNuevoTurnoProductoId] = useState<string>("");
  const [nuevoTurnoProductoCantidad, setNuevoTurnoProductoCantidad] = useState<string>("1");
  const [nuevoTurnoProductos, setNuevoTurnoProductos] = useState<
    Array<{ productoId: number; cantidad: number; precioUnitario: number; nombre: string }>
  >([]);

  useEffect(() => {
    if (show && cliente) {
      cargarHistorial();
    }
  }, [show, cliente]);

  useEffect(() => {
    if (!showAddTurno) return;
    // Defaults
    if (!nuevoTurnoFecha) {
      setNuevoTurnoFecha(new Date().toISOString().slice(0, 10));
    }
    if (!nuevoTurnoHora) {
      setNuevoTurnoHora("09:00");
    }

    // Cargar usuarios para poder asignar profesional (opcional)
    const cargarUsuarios = async () => {
      try {
        const res = await fetch(`${API_URL}/usuarios`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setUsuariosOptions(data);
      } catch {
        // ignore
      }
    };

    if (usuariosOptions.length === 0) {
      cargarUsuarios();
    }
  }, [showAddTurno, nuevoTurnoFecha, nuevoTurnoHora, usuariosOptions.length]);

  const cargarHistorial = async () => {
    if (!cliente) return;

    setLoading(true);
    try {
      // Cargar productos
      const productosRes = await fetch(`${API_URL}/productos`);
      if (productosRes.ok) {
        const productosData = await productosRes.json();
        setProductos(productosData);
      }

      // Cargar servicios
      const serviciosRes = await fetch(`${API_URL}/servicios`);
      if (serviciosRes.ok) {
        const serviciosData = await serviciosRes.json();
        setServicios(serviciosData);
      }

      // Cargar turnos del cliente
      const turnosRes = await fetch(
        `${API_URL}/clientes/${cliente.id}/turnos`
      );
      if (turnosRes.ok) {
        const turnosData = await turnosRes.json();
        setTurnos(turnosData);
      } else {
        console.error("Error cargando turnos:", turnosRes.status);
        setTurnos([]);
      }

      // Cargar facturas del cliente
      const facturasRes = await fetch(
        `${API_URL}/clientes/${cliente.id}/facturas`
      );
      if (facturasRes.ok) {
        const facturasData = await facturasRes.json();
        console.log("Facturas cargadas:", facturasData);
        console.log("Detalles de primera factura:", facturasData[0]?.detalles);
        setFacturas(facturasData);
      } else {
        console.error("Error cargando facturas:", facturasRes.status);
        setFacturas([]);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      setTurnos([]);
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    // Ajustar timezone para evitar que reste un día
    const fechaLocal = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
    return fechaLocal.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearPrecio = (precio: any) => {
    const num = parseFloat(precio);
    return isNaN(num) ? 0 : num;
  };

  // Combinar turnos y facturas en un historial unificado
  const historialCombinado: ServicioHistorial[] = [
    // Incluir SOLO los turnos cobrados (facturados)
    ...turnos
      .filter((turno) => turno.estado === 'cobrado')
      .map((turno) => {
        // Buscar la factura del turno para mostrar el monto real y productos
        const facturaDelTurno = facturas.find((f) => 
          f.detalles.some((d) => d.turnoId === turno.id)
        );
        
        if (facturaDelTurno) {
          // Calcular el monto TOTAL de la factura (servicios + productos)
          const montoTotal = facturaDelTurno.detalles.reduce((total, detalle) => {
            return total + formatearPrecio(detalle.subtotal);
          }, 0);
          
          // Obtener los nombres de los productos
          const productosNombres = facturaDelTurno.detalles
            .filter((d) => d.tipo_item === "producto")
            .map((p) => {
              const producto = productos.find((prod) => prod.id === p.itemId);
              console.log(`Buscando producto con ID ${p.itemId}, encontrado:`, producto);
              if (producto) {
                return `${producto.nombre} (x${p.cantidad})`;
              }
              return `Producto #${p.itemId} (x${p.cantidad})`;
            });
          
          console.log("Productos para turno:", productosNombres);
          
          return {
            fecha: formatearFecha(facturaDelTurno.createdAt),
            servicio: turno.servicio?.servicio || "Servicio no disponible",
            profesional: turno.usuario
              ? `${turno.usuario.nombre} ${turno.usuario.apellido}`
              : "No asignado",
            productos: productosNombres,
            nota: turno.notas || `Método de pago: ${facturaDelTurno.metodoPago}`,
            monto: montoTotal,
          };
        }
        
        // Si no hay factura pero está marcado como cobrado, usar datos del turno
        const productosDelTurno = (turno.productos || []).map((p) => {
          const nombre =
            p?.producto?.nombre ||
            productos.find((prod) => prod.id === p.productoId)?.nombre ||
            `Producto #${p.productoId}`;
          return `${nombre} (x${p.cantidad})`;
        });

        return {
          fecha: formatearFecha(turno.fecha),
          servicio: turno.servicio?.servicio || "Servicio no disponible",
          profesional: turno.usuario
            ? `${turno.usuario.nombre} ${turno.usuario.apellido}`
            : "No asignado",
          productos: productosDelTurno,
          nota: turno.notas || "Sin notas",
          monto: formatearPrecio(turno.servicio?.precio),
        };
    }),
  ];

  // Ordenar historial
  const historialOrdenado = [...historialCombinado].sort((a, b) => {
    const fechaA = new Date(a.fecha.split("/").reverse().join("-"));
    const fechaB = new Date(b.fecha.split("/").reverse().join("-"));
    return sortDirection === "asc"
      ? fechaA.getTime() - fechaB.getTime()
      : fechaB.getTime() - fechaA.getTime();
  });

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const abrirAgregarTurnoPasado = () => {
    setAddTurnoError("");
    setNuevoTurnoServicioId("");
    setNuevoTurnoUsuarioId("");
    setNuevoTurnoNotas("");
    setNuevoTurnoProductoId("");
    setNuevoTurnoProductoCantidad("1");
    setNuevoTurnoProductos([]);
    setShowAddTurno(true);
  };

  const cerrarAgregarTurnoPasado = () => {
    if (addTurnoLoading) return;
    setShowAddTurno(false);
    setAddTurnoError("");
  };

  const agregarProductoATurno = () => {
    setAddTurnoError("");

    if (!nuevoTurnoProductoId) return;

    const cantidadNum = Number(nuevoTurnoProductoCantidad || "1");
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      setAddTurnoError("Ingresá una cantidad válida");
      return;
    }

    const producto = (productos as ProductoOption[]).find(
      (p) => String(p.id) === String(nuevoTurnoProductoId)
    );
    if (!producto) {
      setAddTurnoError("Producto no encontrado");
      return;
    }

    const precioUnitario = Number(producto.precio);

    setNuevoTurnoProductos((prev) => {
      const idx = prev.findIndex((p) => p.productoId === producto.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          cantidad: copy[idx].cantidad + cantidadNum,
        };
        return copy;
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          cantidad: cantidadNum,
          precioUnitario,
          nombre: producto.nombre,
        },
      ];
    });

    setNuevoTurnoProductoId("");
    setNuevoTurnoProductoCantidad("1");
  };

  const quitarProductoDeTurno = (productoId: number) => {
    setNuevoTurnoProductos((prev) => prev.filter((p) => p.productoId !== productoId));
  };

  const guardarTurnoPasado = async () => {
    if (!cliente) return;

    setAddTurnoError("");

    if (!nuevoTurnoServicioId) {
      setAddTurnoError("Seleccioná un servicio");
      return;
    }
    if (!nuevoTurnoFecha) {
      setAddTurnoError("Seleccioná una fecha");
      return;
    }
    if (!nuevoTurnoHora) {
      setAddTurnoError("Seleccioná una hora");
      return;
    }

    setAddTurnoLoading(true);
    try {
      const createRes = await fetch(`${API_URL}/turnos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId: cliente.id,
          servicioId: Number(nuevoTurnoServicioId),
          usuarioId: nuevoTurnoUsuarioId ? Number(nuevoTurnoUsuarioId) : undefined,
          fecha: nuevoTurnoFecha,
          hora: nuevoTurnoHora,
          notas: nuevoTurnoNotas || undefined,
          productos:
            nuevoTurnoProductos.length > 0
              ? nuevoTurnoProductos.map((p) => ({
                  productoId: p.productoId,
                  cantidad: p.cantidad,
                  precioUnitario: p.precioUnitario,
                }))
              : undefined,
        }),
      });

      if (!createRes.ok) {
        let message = "No se pudo crear el turno";
        try {
          const body = await createRes.json();
          if (typeof body?.message === "string") message = body.message;
          if (Array.isArray(body?.message)) message = body.message.join(", ");
        } catch {
          // ignore
          // ignore
        }
        throw new Error(message);
      }

      const turnoCreado = await createRes.json();

      // Como es un turno ya realizado, lo marcamos como cobrado para que aparezca en el historial.
      const patchRes = await fetch(`${API_URL}/turnos/${turnoCreado.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "cobrado" }),
      });

      if (!patchRes.ok) {
        // Si falla el cambio de estado, al menos queda creado.
        console.warn("No se pudo marcar como cobrado el turno creado");
      }

      await cargarHistorial();
      setShowAddTurno(false);
    } catch (e: any) {
      setAddTurnoError(e?.message || "Error al guardar el turno");
    } finally {
      setAddTurnoLoading(false);
    }
  };

  if (!show || !cliente) return null;

  return (
    <div className="historial-modal-overlay">
      <div className="historial-modal-content">
        <div className="historial-modal-header">
          <div className="cliente-info-header">
            <div className="cliente-avatar">
              <FaUser size={32} />
            </div>
            <div>
              <h2 className="cliente-nombre">
                {formatFullName(cliente.nombre, cliente.apellido)}
              </h2>
              <div className="cliente-contacto">
                <span>
                  <FaPhone className="inline mr-1" />
                  {cliente.telefono}
                </span>
                <span>
                  <FaEnvelope className="inline mr-1" />
                  {cliente.email}
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="historial-content">
          {loading ? (
            <div className="loading-state">Cargando historial...</div>
          ) : (
            <div className="tab-content">
              {/* Botones de navegación dentro del contenido */}
              <div className="tabs-header">
                <button
                  className={`tab-btn ${
                    activeTab === "servicios" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("servicios")}
                >
                  <FaCut />
                  Servicios
                </button>
                <button
                  className={`tab-btn ${activeTab === "datos" ? "active" : ""}`}
                  onClick={() => setActiveTab("datos")}
                >
                  <FaUser />
                  Datos personales
                </button>
              </div>

              {/* Contenido de las pestañas */}
              {activeTab === "servicios" && (
                <>
                  <div className="servicios-header">
                    <h3 className="servicios-title">Historial de servicios</h3>
                    <div className="servicios-actions">
                      <button
                        className="sort-btn-v0"
                        onClick={abrirAgregarTurnoPasado}
                      >
                        <FaPlus />
                        Agregar turno pasado
                      </button>
                      <button
                        className="sort-btn-v0"
                        onClick={toggleSortDirection}
                      >
                        <FaSort />
                        Ordenar{" "}
                        {sortDirection === "asc" ? (
                          <FaArrowUp />
                        ) : (
                          <FaArrowDown />
                        )}
                      </button>
                    </div>
                  </div>

                  {showAddTurno && (
                    <div className="agregar-turno-panel">
                      <div className="agregar-turno-title">
                        Cargar turno ya realizado
                      </div>

                      {addTurnoError && (
                        <div className="agregar-turno-error">{addTurnoError}</div>
                      )}

                      <div className="agregar-turno-grid">
                        <div className="agregar-turno-field">
                          <label>Fecha</label>
                          <input
                            type="date"
                            value={nuevoTurnoFecha}
                            onChange={(e) => setNuevoTurnoFecha(e.target.value)}
                            disabled={addTurnoLoading}
                          />
                        </div>

                        <div className="agregar-turno-field">
                          <label>Hora</label>
                          <input
                            type="time"
                            value={nuevoTurnoHora}
                            onChange={(e) => setNuevoTurnoHora(e.target.value)}
                            disabled={addTurnoLoading}
                          />
                        </div>

                        <div className="agregar-turno-field">
                          <label>Servicio</label>
                          <select
                            value={nuevoTurnoServicioId}
                            onChange={(e) => setNuevoTurnoServicioId(e.target.value)}
                            disabled={addTurnoLoading}
                          >
                            <option value="">Seleccionar servicio</option>
                            {servicios.map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.servicio} (${Number(s.precio || 0).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="agregar-turno-field">
                          <label>Profesional (opcional)</label>
                          <select
                            value={nuevoTurnoUsuarioId}
                            onChange={(e) => setNuevoTurnoUsuarioId(e.target.value)}
                            disabled={addTurnoLoading}
                          >
                            <option value="">Sin asignar</option>
                            {usuariosOptions
                              .filter((u) => u.activo !== false)
                              .map((u) => (
                                <option key={u.id} value={String(u.id)}>
                                  {u.nombre} {u.apellido}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="agregar-turno-field agregar-turno-notas">
                          <label>Notas (opcional)</label>
                          <textarea
                            value={nuevoTurnoNotas}
                            onChange={(e) => setNuevoTurnoNotas(e.target.value)}
                            disabled={addTurnoLoading}
                            placeholder="Ej: vino con la grilla previa / detalle del servicio"
                          />
                        </div>

                        <div className="agregar-turno-field agregar-turno-productos">
                          <label>Productos (opcional)</label>

                          <div className="agregar-turno-productos-row">
                            <select
                              value={nuevoTurnoProductoId}
                              onChange={(e) => setNuevoTurnoProductoId(e.target.value)}
                              disabled={addTurnoLoading}
                            >
                              <option value="">Seleccionar producto</option>
                              {(productos as ProductoOption[])
                                .slice()
                                .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
                                .map((p) => (
                                  <option key={p.id} value={String(p.id)}>
                                    {p.nombre} (${Number(p.precio || 0).toLocaleString()})
                                  </option>
                                ))}
                            </select>

                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={nuevoTurnoProductoCantidad}
                              onChange={(e) => setNuevoTurnoProductoCantidad(e.target.value)}
                              disabled={addTurnoLoading}
                              placeholder="Cant."
                            />

                            <button
                              type="button"
                              className="sort-btn-v0"
                              onClick={agregarProductoATurno}
                              disabled={addTurnoLoading || !nuevoTurnoProductoId}
                            >
                              Agregar
                            </button>
                          </div>

                          {nuevoTurnoProductos.length > 0 && (
                            <div className="agregar-turno-productos-list">
                              {nuevoTurnoProductos.map((p) => (
                                <div
                                  key={p.productoId}
                                  className="agregar-turno-producto-item"
                                >
                                  <span>
                                    {p.nombre} (x{p.cantidad})
                                  </span>
                                  <button
                                    type="button"
                                    className="agregar-turno-producto-remove"
                                    onClick={() => quitarProductoDeTurno(p.productoId)}
                                    disabled={addTurnoLoading}
                                    aria-label="Quitar producto"
                                    title="Quitar"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="agregar-turno-actions">
                        <button
                          className="sort-btn-v0"
                          onClick={cerrarAgregarTurnoPasado}
                          disabled={addTurnoLoading}
                        >
                          Cancelar
                        </button>
                        <button
                          className="sort-btn-v0"
                          onClick={guardarTurnoPasado}
                          disabled={addTurnoLoading}
                        >
                          {addTurnoLoading ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </div>
                  )}

                  {historialOrdenado.length === 0 ? (
                    <div className="empty-state">
                      <FaCut size={48} />
                      <p>No hay servicios registrados para este cliente</p>
                    </div>
                  ) : (
                    <div className="servicios-table">
                      <table className="historial-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Servicio</th>
                            <th>Profesional</th>
                            <th>Productos</th>
                            <th>Nota</th>
                            <th>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialOrdenado.map((servicio, index) => (
                            <tr key={index}>
                              <td className="fecha-cell" data-label="Fecha">{servicio.fecha}</td>
                              <td data-label="Servicio">
                                <div className="servicio-cell">
                                  <div className="servicio-icon">
                                    <FaCut />
                                  </div>
                                  <span>{servicio.servicio}</span>
                                </div>
                              </td>
                              <td data-label="Profesional">
                                <div className="profesional-cell">
                                  <div className="profesional-icon">
                                    <FaUser />
                                  </div>
                                  <span>{servicio.profesional}</span>
                                </div>
                              </td>
                              <td data-label="Productos">
                                {servicio.productos.length > 0 ? (
                                  <div className="productos-cell">
                                    {servicio.productos.map((producto, idx) => (
                                      <span
                                        key={idx}
                                        className="producto-badge"
                                      >
                                        <FaBox />
                                        {producto}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="sin-productos">
                                    Sin productos
                                  </span>
                                )}
                              </td>
                              <td className="nota-cell" data-label="Nota">{servicio.nota}</td>
                              <td className="monto-cell" data-label="Monto">
                                ${servicio.monto.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Pestaña de Datos Personales */}
              {activeTab === "datos" && (
                <>
                  <h3 className="datos-title">Datos personales</h3>
                  <div className="datos-grid">
                    <div className="datos-card">
                      <h4 className="datos-card-title">Información básica</h4>
                      <div className="datos-field">
                        <label>Nombre completo</label>
                        <span>
                          {formatFullName(cliente.nombre, cliente.apellido)}
                        </span>
                      </div>
                      <div className="datos-field">
                        <label>DNI</label>
                        <span>{cliente.dni}</span>
                      </div>
                      <div className="datos-field">
                        <label>Fecha de nacimiento</label>
                        <span>
                          {cliente.fechaNacimiento || "No especificado"}
                        </span>
                      </div>
                    </div>

                    <div className="datos-card">
                      <h4 className="datos-card-title">Contacto</h4>
                      <div className="datos-field">
                        <label>Teléfono</label>
                        <span>{cliente.telefono}</span>
                      </div>
                      <div className="datos-field">
                        <label>Email</label>
                        <span>{cliente.email}</span>
                      </div>
                    </div>

                    <div className="datos-card estadisticas-card">
                      <h4 className="datos-card-title">Estadísticas</h4>
                      <div className="estadisticas-grid">
                        <div className="estadistica">
                          <label>Total de visitas</label>
                          <span className="estadistica-numero">
                            {cliente.visitas || facturas.length}
                          </span>
                        </div>
                        <div className="estadistica">
                          <label>Última visita</label>
                          <span>{cliente.ultimaVisita || "No registrada"}</span>
                        </div>
                        <div className="estadistica">
                          <label>Estado</label>
                          <span
                            className={`estado-badge ${
                              cliente.activo ? "activo" : "inactivo"
                            }`}
                          >
                            {cliente.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="historial-footer">
          <button className="close-footer-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistorialClienteModal;
