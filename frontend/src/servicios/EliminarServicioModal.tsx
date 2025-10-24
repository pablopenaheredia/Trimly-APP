// frontend/src/servicios/EliminarServicioModal.tsx - CREAR ESTE ARCHIVO
import React from 'react';
import './EliminarServicioModal.css';

interface Servicio {
  id: number;
  servicio: string;
  descripcion: string;
  duracion: number;
  precio: number;
  estado: boolean;
}

interface Props {
  show: boolean;
  onClose: () => void;
  servicioToDelete?: Servicio;
  onServicioEliminado: () => Promise<void>;
}

export default function EliminarServicioModal({
  show,
  onClose,
  servicioToDelete,
  onServicioEliminado,
}: Props) {

  if (!show || !servicioToDelete) {
    return null;
  }

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:3000/servicios/${servicioToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Error al eliminar el servicio: ${errorData.message || res.statusText}`
        );
      }

      console.log(`Servicio "${servicioToDelete.servicio}" eliminado con éxito.`);
      onServicioEliminado();
      onClose();
    } catch (error: any) {
      console.error("Error al eliminar servicio:", error);
      console.error(`No se pudo eliminar el servicio: ${error.message}`);
    }
  };

  return (
    <div className="modal-bg">
      <div className="eliminar-servicio-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Eliminar Servicio</h2>
        <p className="modal-subtitle">
          ¿Estás seguro de que quieres eliminar el servicio{" "}
          <span className="fw-bold service-name-highlight">
            "{servicioToDelete.servicio}"
          </span>
          ?
        </p>
        <div className="service-details">
          <div className="detail-item">
            <span className="detail-label">Descripción:</span>
            <span className="detail-value">{servicioToDelete.descripcion}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duración:</span>
            <span className="detail-value">{servicioToDelete.duracion}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Precio:</span>
            <span className="detail-value price">${servicioToDelete.precio}</span>
          </div>
        </div>
        <p className="eliminar-warning">
          ⚠️ Esta acción no se puede deshacer. El servicio será eliminado permanentemente.
        </p>
        <div className="form-row buttons">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="confirm-delete-btn" onClick={handleConfirmDelete}>
            Eliminar servicio
          </button>
        </div>
      </div>
    </div>
  );
}