import React from 'react';
import './EliminarProductoModal.css';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  marca: string;
  precio: number;
  stock: number;
  estado: "Alto" | "Medio" | "Bajo";
}

interface Props {
  show: boolean;
  onClose: () => void;
  producto: Producto | null;
  onProductoEliminado: (productoEliminado: Producto) => void;
}

export default function EliminarProductoModal({
  show,
  onClose,
  producto,
  onProductoEliminado,
}: Props) {
  if (!show || !producto) {
    return null;
  }

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:3000/producto/${producto.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Error al eliminar el producto: ${errorData.message || res.statusText}`
        );
      }

      console.log(`Producto "${producto.nombre}" eliminado con éxito.`);
      onProductoEliminado(producto);
      onClose();
    } catch (error: any) {
      console.error("Error al eliminar producto:", error);
      alert(`No se pudo eliminar el producto: ${error.message}`);
    }
  };

  return (
    <div className="modal-bg">
      <div className="eliminar-producto-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Eliminar Producto</h2>
        <p className="modal-subtitle">
          ¿Estás seguro de que querés eliminar el producto{" "}
          <span className="fw-bold service-name-highlight">
            "{producto.nombre}"
          </span>
          ?
        </p>
        <div className="product-details">
          <div className="detail-item">
            <span className="detail-label">Categoría:</span>
            <span className="detail-value">{producto.categoria}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Marca:</span>
            <span className="detail-value">{producto.marca}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Precio:</span>
            <span className="detail-value price">${producto.precio}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Stock:</span>
            <span className="detail-value">{producto.stock} unidades</span>
          </div>
        </div>
        <p className="eliminar-warning">
          ⚠️ Esta acción no se puede deshacer. El producto será eliminado permanentemente.
        </p>
        <div className="form-row buttons">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="confirm-delete-btn" onClick={handleConfirmDelete}>
            Eliminar producto
          </button>
        </div>
      </div>
    </div>
  );
}
