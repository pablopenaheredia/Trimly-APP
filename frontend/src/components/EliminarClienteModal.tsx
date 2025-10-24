// src/components/EliminarClienteModal.tsx

import "./EliminarClienteModal.css"; // Asegúrate de crear este archivo CSS

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  // Añade otras propiedades que quieras mostrar en la modal de confirmación
}

interface Props {
  show: boolean;
  onClose: () => void;
  clienteToDeactivate?: Cliente; // El cliente que vamos a desactivar
  onClienteDesactivado: () => Promise<void>; // Callback para recargar la lista
}

export default function EliminarClienteModal({
  show,
  onClose,
  clienteToDeactivate,
  onClienteDesactivado,
}: Props) {
  // Si la modal no debe mostrarse o no hay cliente, no renderizamos nada
  if (!show || !clienteToDeactivate) {
    return null;
  }

  const handleConfirmDeactivate = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/clientes/${clienteToDeactivate.id}`,
        {
          method: "PATCH", // Usamos PATCH para actualizar el estado 'activo'
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: false }), // Enviamos { activo: false }
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Error al desactivar el cliente: ${
            errorData.message || res.statusText
          }`
        );
      }

      alert(
        `Cliente ${clienteToDeactivate.nombre} ${clienteToDeactivate.apellido} desactivado con éxito.`
      );
      onClienteDesactivado(); // Llama al callback para que Clientes.tsx recargue la lista
      onClose(); // Cierra la modal
    } catch (error: any) {
      console.error("Error al desactivar cliente:", error);
      alert(`No se pudo desactivar el cliente: ${error.message}`);
    }
  };

  return (
    <div className="modal-bg">
      <div className="eliminar-cliente-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Desactivar Cliente</h2>
        <p className="modal-subtitle">
          ¿Estás seguro de que quieres desactivar a{" "}
          <span className="fw-bold">
            {clienteToDeactivate.nombre} {clienteToDeactivate.apellido}
          </span>
          ?
        </p>
        <p className="eliminar-warning">
          El cliente ya no podrá agendar turnos y aparecerá como inactivo en la
          lista.
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
  );
}
