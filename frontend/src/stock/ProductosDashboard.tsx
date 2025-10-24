import React, { useEffect, useState } from "react";
import { FaBoxOpen, FaEdit, FaTrash } from "react-icons/fa";
import "./ProductosDashboard.css";
import NuevoProductoModal from "./NuevoProductoModal"; 
import EditarProductoModal from "./EditarProductoModal";
import EliminarProductoModal from "./EliminarProductoModal";
import SuccessModal from "../components/SuccessModal";
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

export default function ProductosDashboard() {
  // Obtener permisos del usuario
  const { hasPermission } = usePermissions();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false); 
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  
  // ✅ NUEVO ESTADO PARA SUCCESS MODAL
  const [successModal, setSuccessModal] = useState<{show: boolean, message: string}>({
    show: false, 
    message: ""
  });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await fetch("http://localhost:3000/producto"); 
        const data = await res.json();
        setProductos(data); 
      } catch (error) {
        console.error("Error al cargar productos:", error);
        alert("No se pudieron cargar los productos.");
      }
    };

    cargarProductos();
  }, []);

  // ✅ FUNCIONES PARA MANEJAR LOS SUCCESS MODALS
  const handleProductoCreado = (nuevoProducto: Producto) => {
    setProductos((prev) => [...prev, nuevoProducto]);
    setShowModal(false);
    setSuccessModal({show: true, message: "Producto creado correctamente"});
  };

  const handleProductoEditado = (productoEditado: Producto) => {
    setProductos((prev) =>
      prev.map((prod) => (prod.id === productoEditado.id ? productoEditado : prod))
    );
    setShowEditarModal(false);
    setSuccessModal({show: true, message: "Producto editado correctamente"});
  };

  const handleProductoEliminado = (productoEliminado: Producto) => {
    setProductos((prev) => prev.filter((prod) => prod.id !== productoEliminado.id));
    setShowEliminarModal(false);
    setSuccessModal({show: true, message: "Producto eliminado correctamente"});
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.marca.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
   <div className="productos-dashboard-container">
  {/* ✅ AGREGAR SUCCESS MODAL */}
  <SuccessModal
    show={successModal.show}
    message={successModal.message}
    onClose={() => setSuccessModal({show: false, message: ""})}
  />

  <div className="dashboard-header">
    <h1>Gestión de Stock</h1>
    <div className="dashboard-actions">
      {/* Verificar permiso para crear productos */}
      {hasPermission('productos.create') && (
        <button 
          className="nuevo-producto-btn"
          onClick={() => setShowModal(true)}
        >
          + Nuevo producto
        </button>
      )}
    </div>
  </div>

  <input
    type="text"
    placeholder="Buscar productos..."
    className="busqueda-input"
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
  />

  {/* Contenedor con scroll moderno pegado a la derecha */}
  <div className="tabla-productos-wrapper">
    <table className="productos-table">
      <thead>
        <tr>
          <th><FaBoxOpen className="icono-producto" /> Producto</th>
          <th>Categoría</th>
          <th>Marca</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productosFiltrados.map((p) => (
          <tr key={p.id}>
            <td>{p.nombre}</td>
            <td><span className="categoria-badge">{p.categoria}</span></td>
            <td>{p.marca}</td>
            <td>${p.precio}</td>
            <td>{p.stock}</td>
            <td>
              <span
                className={`estado-badge ${
                  p.estado === "Alto"
                    ? "estado-alto"
                    : p.estado === "Medio"
                    ? "estado-medio"
                    : "estado-bajo"
                }`}
              >
                {p.estado}
              </span>
            </td>
            <td>
              {/* Verificar permiso para editar productos */}
              {hasPermission('productos.edit') && (
                <button
                  className="btn-accion editar"
                  onClick={() => {
                    setProductoAEditar(p);
                    setShowEditarModal(true);
                  }}
                >
                  <FaEdit />
                </button>
              )}
              
              {/* Verificar permiso para eliminar productos */}
              {hasPermission('productos.delete') && (
                <button
                  className="btn-accion eliminar"
                  onClick={() => {
                    setProductoAEliminar(p);
                    setShowEliminarModal(true);
                  }}
                >
                  <FaTrash />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* ✅ ACTUALIZAR MODALES PARA USAR LAS NUEVAS FUNCIONES */}
  <NuevoProductoModal
    show={showModal}
    onClose={() => setShowModal(false)}
    onProductoCreado={handleProductoCreado}
  />

  <EditarProductoModal
    show={showEditarModal}
    onClose={() => setShowEditarModal(false)}
    producto={productoAEditar}
    onProductoEditado={handleProductoEditado}
  />

  <EliminarProductoModal
    show={showEliminarModal}
    onClose={() => setShowEliminarModal(false)}
    producto={productoAEliminar}
    onProductoEliminado={handleProductoEliminado}
  />
</div>
  );
}