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
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import "./HistorialClienteModal.css";

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

const HistorialClienteModal: React.FC<Props> = ({ show, onClose, cliente }) => {
  const [activeTab, setActiveTab] = useState<"servicios" | "datos">(
    "servicios"
  );
  const [turnos, setTurnos] = useState<TurnoHistorial[]>([]);
  const [facturas, setFacturas] = useState<FacturaHistorial[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (show && cliente) {
      cargarHistorial();
    }
  }, [show, cliente]);

  const cargarHistorial = async () => {
    if (!cliente) return;

    setLoading(true);
    try {
      // Cargar turnos del cliente
      const turnosRes = await fetch(
        `http://localhost:3000/clientes/${cliente.id}/turnos`
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
        `http://localhost:3000/clientes/${cliente.id}/facturas`
      );
      if (facturasRes.ok) {
        const facturasData = await facturasRes.json();
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
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearPrecio = (precio: any) => {
    const num = parseFloat(precio);
    return isNaN(num) ? 0 : num;
  };

  // Combinar turnos y facturas en un historial unificado como v0
  const historialCombinado: ServicioHistorial[] = [
    // Convertir turnos a formato de v0
    ...turnos.map((turno) => ({
      fecha: formatearFecha(turno.fecha),
      servicio: turno.servicio?.servicio || "Servicio no disponible",
      profesional: turno.usuario
        ? `${turno.usuario.nombre} ${turno.usuario.apellido}`
        : "No asignado",
      productos: [], // Los turnos no tienen productos asociados directamente
      nota: turno.notas || "Sin notas",
      monto: formatearPrecio(turno.servicio?.precio),
    })),
    // Convertir servicios de facturas a formato de v0
    ...facturas.flatMap((factura) =>
      factura.detalles
        .filter((detalle) => detalle.tipo_item === "servicio")
        .map((detalle) => ({
          fecha: formatearFecha(factura.createdAt),
          servicio: `Servicio #${detalle.itemId}`,
          profesional: "Profesional no especificado",
          productos:
            facturas
              .find((f) => f.id === factura.id)
              ?.detalles.filter((d) => d.tipo_item === "producto")
              .map((p) => `Producto #${p.itemId}`) || [],
          nota: `Método de pago: ${factura.metodoPago}`,
          monto: formatearPrecio(detalle.subtotal),
        }))
    ),
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
                {cliente.nombre} {cliente.apellido}
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
                              <td className="fecha-cell">{servicio.fecha}</td>
                              <td>
                                <div className="servicio-cell">
                                  <div className="servicio-icon">
                                    <FaCut />
                                  </div>
                                  <span>{servicio.servicio}</span>
                                </div>
                              </td>
                              <td>
                                <div className="profesional-cell">
                                  <div className="profesional-icon">
                                    <FaUser />
                                  </div>
                                  <span>{servicio.profesional}</span>
                                </div>
                              </td>
                              <td>
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
                              <td className="nota-cell">{servicio.nota}</td>
                              <td className="monto-cell">
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
                          {cliente.nombre} {cliente.apellido}
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
