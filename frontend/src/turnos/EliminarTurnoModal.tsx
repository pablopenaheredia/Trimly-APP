import React from "react";
import "./EliminarTurnoModal.css";
import SuccessModal from "../components/SuccessModal";
import { useState } from "react";

interface Turno {
  id: number;
  clienteId: number;
  servicioId: number;
  fecha: string;
  hora: string;
  notas?: string;
  cliente?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  servicio?: {
    id: number;
    servicio: string;
  };
}

interface Props {
  show: boolean;
  onClose: () => void;
  turnoToDelete?: Turno;
  onTurnoCancelado: () => Promise<void>;
}

export default function EliminarTurnoModal({
  show,
  onClose,
  turnoToDelete,
  onTurnoCancelado,
}: Props) {
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  if (!show || !turnoToDelete) {
    return null;
  }

  // Función para verificar si una fecha es pasada
  const isPastDate = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    // Dividir la fecha para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-').map(Number);
    const checkDate = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
    
    return checkDate < today;
  };

  // Verificar si el turno es de una fecha pasada
  const isTurnoPast = isPastDate(turnoToDelete.fecha);

  const formatFecha = (fechaStr: string): string => {
    // Dividir la fecha para evitar problemas de zona horaria
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleConfirmDelete = async () => {
    // No deberíamos llegar aquí si el turno es pasado, pero verificamos por seguridad
    if (isTurnoPast) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/turnos/${turnoToDelete.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Error al cancelar el turno: ${errorData.message || res.statusText}`
        );
      }

      setSuccessModal({
        show: true,
        message: `Turno cancelado correctamente.`,
      });
    } catch (error: any) {
      console.error("Error al cancelar turno:", error);
      alert(`No se pudo cancelar el turno: ${error.message}`);
    }
  };

  const handleSuccessModalClose = async () => {
    setSuccessModal({ show: false, message: "" });
    await onTurnoCancelado();
    onClose();
  };

  // Si el turno es de una fecha pasada, mostrar un mensaje informativo en lugar del formulario de confirmación
  if (isTurnoPast) {
    return (
      <div className="modal-bg">
        <div className="eliminar-turno-modal-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
          <h2 className="modal-title">No se puede cancelar</h2>
          <p className="modal-subtitle">
            No es posible cancelar turnos de fechas pasadas.
          </p>
          <div className="turno-details">
            <div className="detail-item">
              <span className="detail-label">Cliente:</span>
              <span className="detail-value">
                {turnoToDelete.cliente?.nombre}{" "}
                {turnoToDelete.cliente?.apellido}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha:</span>
              <span className="detail-value">
                {formatFecha(turnoToDelete.fecha)}
              </span>
            </div>
          </div>
          <div className="form-row buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal-bg">
        <div className="eliminar-turno-modal-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
          <h2 className="modal-title">Cancelar Turno</h2>
          <p className="modal-subtitle">
            ¿Estás seguro de que quieres cancelar este turno?
          </p>
          <div className="turno-details">
            <div className="detail-item">
              <span className="detail-label">Cliente:</span>
              <span className="detail-value">
                {turnoToDelete.cliente?.nombre}{" "}
                {turnoToDelete.cliente?.apellido}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Servicio:</span>
              <span className="detail-value">
                {turnoToDelete.servicio?.servicio}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha:</span>
              <span className="detail-value">
                {formatFecha(turnoToDelete.fecha)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hora:</span>
              <span className="detail-value">{turnoToDelete.hora}</span>
            </div>
            {turnoToDelete.notas && (
              <div className="detail-item">
                <span className="detail-label">Notas:</span>
                <span className="detail-value">{turnoToDelete.notas}</span>
              </div>
            )}
          </div>
          <p className="eliminar-warning">
            ⚠️ Esta acción no se puede deshacer. El turno será cancelado
            permanentemente.
          </p>
          <div className="form-row buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Volver
            </button>
            <button
              type="button"
              className="confirm-delete-btn"
              onClick={handleConfirmDelete}
            >
              Cancelar turno
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={handleSuccessModalClose}
      />
    </>
  );
}
