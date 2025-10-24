import React, { useEffect, useState } from "react";
import { FaClock, FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";
import "./HistorialTurno.css";

interface Props {
  show: boolean;
  onClose: () => void;
  refreshTrigger?: number;
}

interface Cliente {
  nombre: string;
  apellido: string;
}
interface Servicio {
  servicio: string;
  precio: number;
}
interface Usuario {
  nombre: string;
  apellido: string;
}
interface Factura {
  estado: "pendiente" | "cobrada" | "cancelada";
  createdAt: string;
}
interface Turno {
  id: number;
  cliente: Cliente | null;
  servicio: Servicio | null;
  fecha: string;
  hora: string;
  usuario: Usuario | null;
  estado: "pendiente" | "cobrado" | "cancelado";
  factura?: Factura | null;
}

const HistorialTurnosModal: React.FC<Props> = ({
  show,
  onClose,
  refreshTrigger,
}) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTurnos = () => {
    setLoading(true);
    setError(null);

    fetch("http://localhost:3000/turnos")
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          data.sort(
            (a: Turno, b: Turno) =>
              b.fecha.localeCompare(a.fecha) ||
              (b.hora ?? "").localeCompare(a.hora ?? "")
          );
          setTurnos(data.slice(0, 20));
        } else {
          setTurnos([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando turnos:", err);
        setError("No se pudieron cargar los turnos.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!show) return;
    fetchTurnos();
  }, [show, refreshTrigger]);

  if (!show) return null;

  return (
    <div className="historial-overlay">
      <div className="historial-container">
  
        <button className="cerrar-x" onClick={onClose}>
          <FaTimes />
        </button>

    
        <div className="historial-header">
          <h2>
            <FaClock /> Historial de Turnos
          </h2>
          <p>Últimos 20 turnos realizados y facturados</p>
        </div>

       
        <div className="historial-list-wrapper">
          <div className="historial-list">
            {loading && <p className="historial-empty">Cargando turnos...</p>}
            {error && <p className="historial-empty">{error}</p>}
            {!loading && !error && turnos.length === 0 && (
              <p className="historial-empty">No hay turnos registrados</p>
            )}

            {!loading &&
              !error &&
              turnos.map((turno) => {
                const estado =
                  turno.estado === "cobrado"
                    ? "Pagado"
                    : turno.estado === "cancelado"
                    ? "Cancelado"
                    : "Pendiente";

                const horaMostrar = turno.hora?.slice(0, 5) ?? "-";
                const fechaFactura =
                  turno.factura && turno.factura.createdAt
                    ? new Date(turno.factura.createdAt).toLocaleDateString()
                    : null;

                return (
                  <div key={turno.id} className="historial-card">
                    <div className="historial-icon">
                      <FaClock />
                    </div>

                    <div className="historial-info">
                      <h3>
                        {turno.cliente
                          ? `${turno.cliente.nombre} ${turno.cliente.apellido}`
                          : "Sin cliente"}
                      </h3>

                      <p>{turno.servicio?.servicio ?? "Sin servicio"}</p>
                      <span>
                        {turno.fecha ?? "-"} - {horaMostrar} • Por:{" "}
                        {turno.usuario
                          ? `${turno.usuario.nombre} ${turno.usuario.apellido}`
                          : "Sin asignar"}
                      </span>
                    </div>

                    <div className="historial-status">
                      <strong>${turno.servicio?.precio ?? 0}</strong>
                      {estado === "Pagado" ? (
                        <>
                          <span className="pagado">
                            <FaCheckCircle /> Pagado
                          </span>
                          {fechaFactura && (
                            <p className="fecha-factura">
                              Facturado: {fechaFactura}
                            </p>
                          )}
                        </>
                      ) : estado === "Cancelado" ? (
                        <span className="cancelado">
                          <FaTimesCircle /> Cancelado
                        </span>
                      ) : (
                        <span className="pendiente">
                          <FaClock /> Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

       
        <div className="historial-footer">
          <button onClick={onClose} className="cerrar-btn">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistorialTurnosModal;
