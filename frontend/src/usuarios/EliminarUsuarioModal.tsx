import { useState } from "react";
import "./EliminarUsuarioModal.css";
import SuccessModal from "../components/SuccessModal"; // Asegurate de que esta ruta sea correcta

interface Usuario {
  id: number;
  username: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  usuarioToDeactivate?: Usuario;
  onUsuarioDesactivado: () => Promise<void>;
}

export default function EliminarUsuarioModal({
  show,
  onClose,
  usuarioToDeactivate,
  onUsuarioDesactivado,
}: Props) {
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  if (!show || !usuarioToDeactivate) {
    return null;
  }

  const handleConfirmDeactivate = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/usuarios/${usuarioToDeactivate.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: false }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Error al desactivar el usuario: ${
            errorData.message || res.statusText
          }`
        );
      }

      await onUsuarioDesactivado();

      setSuccessModal({
        show: true,
        message: `Usuario "${usuarioToDeactivate.username}" desactivado con éxito.`,
      });

      // No se ejecuta onClose aquí — se hace cuando se cierra el modal de éxito
    } catch (error: any) {
      console.error("Error al desactivar usuario:", error);
      setSuccessModal({
        show: true,
        message: `No se pudo desactivar el usuario: ${error.message}`,
      });
    }
  };

  return (
    <>
      <div className="modal-bg">
        <div className="eliminar-usuario-modal-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
          <h2 className="modal-title">Desactivar Usuario</h2>
          <p className="modal-subtitle">
            ¿Estás seguro de que quieres desactivar al usuario{" "}
            <span className="fw-bold">@{usuarioToDeactivate.username}</span>?
          </p>
          <p className="eliminar-warning">
            El usuario ya no podrá iniciar sesión y aparecerá como inactivo en
            la lista.
          </p>
          <div className="form-row buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="confirm-delete-btn"
              onClick={handleConfirmDeactivate}
            >
              Desactivar
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={() => {
          setSuccessModal({ show: false, message: "" });
          onClose(); //  Ahora cerramos el modal principal
        }}
      />
    </>
  );
}
