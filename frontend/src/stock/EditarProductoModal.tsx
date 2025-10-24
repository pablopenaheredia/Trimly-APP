import React, { useState, useEffect } from "react";
import "./NuevoProductoModal.css";
import { usePermissions } from "../hooks/usePermissions";

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
  onProductoEditado: (productoEditado: Producto) => void;
}

export default function EditarProductoModal({ show, onClose, producto, onProductoEditado }: Props) {
  // Obtener permisos del usuario
  const { hasPermission } = usePermissions();
  
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    marca: "",
    precio: "",
    stock: "",
    estado: "",
  });

  useEffect(() => {
    if (show && producto) {
      setForm({
        nombre: producto.nombre,
        categoria: producto.categoria,
        marca: producto.marca,
        precio: producto.precio.toString(),
        stock: producto.stock.toString(),
        estado: producto.estado,
      });
    }
  }, [show, producto]);

  // Función que determina el estado según el stock
  const calcularEstado = (stockStr: string): string => {
    const stockNum = parseInt(stockStr);
    if (isNaN(stockNum)) return "";
    if (stockNum <= 5) return "Bajo";
    if (stockNum <= 30) return "Medio";
    return "Alto";
  };

  // Actualizar estado cuando cambia el stock
  useEffect(() => {
    const nuevoEstado = calcularEstado(form.stock);
    setForm((prev) => ({ ...prev, estado: nuevoEstado }));
  }, [form.stock]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Verificar permisos antes de cambiar el stock
    if (name === 'stock' && !hasPermission('productos.edit.stock')) {
      return; // No permitir cambios si no tiene permisos
    }
    
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar nombre duplicado (excepto el propio)
    try {
      const res = await fetch("http://localhost:3000/producto");
      const productos = await res.json();
      const existe = productos.some(
        (p: any) =>
          p.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() &&
          p.id !== producto?.id
      );
      if (existe) {
        alert("Ya existe un producto con ese nombre.");
        return;
      }
    } catch (error) {
      alert("No se pudo validar si el producto ya existe.");
      return;
    }

    // Enviar producto editado
    try {
      // Preparar datos según permisos
      const updateData: any = {
        nombre: form.nombre,
        categoria: form.categoria,
        marca: form.marca,
        precio: parseFloat(form.precio),
      };
      
      // Solo incluir stock y estado si tiene permisos
      if (hasPermission('productos.edit.stock')) {
        updateData.stock = parseInt(form.stock);
        updateData.estado = form.estado || "Alto";
      }
      
      const res = await fetch(`http://localhost:3000/producto/${producto?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        alert("Error al editar el producto. Verifica los datos o el servidor.");
        return;
      }
      const productoEditado = await res.json();
      onProductoEditado(productoEditado);
      onClose();
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  if (!show || !producto) return null;

  return (
    <div className="modal-bg2">
      <div className="nuevo-producto-modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="modal-title">Editar Producto</h2>
        <p className="modal-subtitle">Modifica los datos del producto</p>
        <form onSubmit={handleSubmit}>
          {/* Nombre del producto */}
          <div className="nuevo-input-group">
            <label>Nombre del producto</label>
            <input
              name="nombre"
              placeholder="Ej: Shampoo revitalizante"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          {/* Precio y Stock lado a lado */}
          <div className="form-row">
            <div className="nuevo-input-group">
              <label>Precio</label>
              <input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.precio}
                onChange={handleChange}
                required
              />
            </div>
            <div className="nuevo-input-group">
              <label>Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.stock}
                onChange={handleChange}
                required
                disabled={!hasPermission('productos.edit.stock')}
                style={{
                  backgroundColor: !hasPermission('productos.edit.stock') ? '#f5f5f5' : '',
                  cursor: !hasPermission('productos.edit.stock') ? 'not-allowed' : 'text'
                }}
              />
              {!hasPermission('productos.edit.stock') && (
                <small style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  No tienes permisos para modificar el stock
                </small>
              )}
              {form.estado && (
                <small
                  style={{
                    marginTop: "4px",
                    display: "block",
                    fontWeight: "bold",
                    color:
                      form.estado === "Alto"
                        ? "green"
                        : form.estado === "Medio"
                        ? "orange"
                        : "red",
                  }}
                >
                  Estado: {form.estado}
                </small>
              )}
            </div>
          </div>
          {/* Categoría */}
          <div className="nuevo-input-group">
            <label>Categoría</label>
            <input
              name="categoria"
              placeholder="Seleccionar categoría"
              value={form.categoria}
              onChange={handleChange}
              required
            />
          </div>
          {/* Marca */}
          <div className="nuevo-input-group">
            <label>Marca</label>
            <input
              name="marca"
              placeholder="Ej: L'Oréal"
              value={form.marca}
              onChange={handleChange}
              required
            />
          </div>
          {/* Botones */}
          <div className="form-row buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="create-btn">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}