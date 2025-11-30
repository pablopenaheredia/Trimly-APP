import React, { useEffect, useState } from "react";
import { FaBoxOpen, FaEdit, FaTrash } from "react-icons/fa";
import "./ProductosDashboard.css";
import NuevoProductoModal from "./NuevoProductoModal"; 
import EditarProductoModal from "./EditarProductoModal";
import EliminarProductoModal from "./EliminarProductoModal";
import SuccessModal from "../components/SuccessModal";
import TablaResponsive from "../components/TablaResponsive";
import type { ColumnaTabla } from "../components/TablaResponsive";
import { usePermissions } from "../hooks/usePermissions";
import { API_URL } from "../config/api";

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
        const res = await fetch(`${API_URL}/producto`); 
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

  // Definir columnas de la tabla
  const columns: ColumnaTabla[] = [
    {
      key: "nombre",
      label: "Producto",
      icon: <FaBoxOpen className="icono-producto" />,
    },
    {
      key: "categoria",
      label: "Categoría",
      render: (value) => <span className="categoria-badge">{value}</span>,
    },
    {
      key: "marca",
      label: "Marca",
    },
    {
      key: "precio",
      label: "Precio",
      render: (value) => `$${value}`,
    },
    {
      key: "stock",
      label: "Stock",
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => (
        <span
          className={`estado-badge ${
            value === "Alto"
              ? "estado-alto"
              : value === "Medio"
              ? "estado-medio"
              : "estado-bajo"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (_, row) => (
        <>
          {hasPermission('productos.edit') && (
            <button
              className="btn-accion editar"
              onClick={() => {
                setProductoAEditar(row);
                setShowEditarModal(true);
              }}
            >
              <FaEdit />
            </button>
          )}
          {hasPermission('productos.delete') && (
            <button
              className="btn-accion eliminar"
              onClick={() => {
                setProductoAEliminar(row);
                setShowEliminarModal(true);
              }}
            >
              <FaTrash />
            </button>
          )}
        </>
      ),
    },
  ];

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

  <TablaResponsive
    columns={columns}
    data={productosFiltrados}
    keyExtractor={(producto) => producto.id}
    className="tabla-productos-wrapper"
  />

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