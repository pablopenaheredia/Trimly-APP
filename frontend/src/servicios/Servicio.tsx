// frontend/src/servicios/Servicio.tsx - ACTUALIZAR CON MODAL DE ELIMINACIÓN
import { useState, useEffect } from "react";
import "./Servicio.css";
import Tabla from "../components/Tabla";
import NuevoServicioModal from "./NuevoServicioModal";
import EditarServicioModal from "./EditarServicioModal";
import EliminarServicioModal from "./EliminarServicioModal";
import SuccessModal from "../components/SuccessModal";
import { FaClock, FaEdit, FaTrash, FaCut } from "react-icons/fa";
import { usePermissions } from "../hooks/usePermissions";

interface Servicio {
  id: number;
  servicio: string;
  descripcion: string;
  duracion: number;
  precio: number;
  estado: boolean;
}

const columns = [
  { key: "servicio", label: "Servicio" },
  { key: "descripcion", label: "Descripción" },
  { key: "duracion", label: "Duración" },
  { key: "precio", label: "Precio" },
  { key: "estado", label: "Estado" },
  { key: "acciones", label: "Acciones" },
];

export default function Servicios() {
  // Obtener permisos del usuario
  const { hasPermission } = usePermissions();
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioEditar, setServicioEditar] = useState<Servicio | null>(null);
  const [servicioEliminar, setServicioEliminar] = useState<Servicio | undefined>(undefined);
  const [busqueda, setBusqueda] = useState("");
  const [successModal, setSuccessModal] = useState<{show: boolean, message: string}>({show: false, message: ""});

  // Cargar servicios desde el backend
  const cargarServicios = async () => {
    try {
      const res = await fetch("http://localhost:3000/servicios");
      const data = await res.json();
      setServicios(data);
    } catch (error) {
      alert("No se pudieron cargar los servicios.");
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const handleServicioCreado = () => {
    setShowModal(false);
    setSuccessModal({show: true, message: "Servicio creado correctamente"});
    cargarServicios();
  };

  const handleServicioEditado = () => {
    setShowEditModal(false);
    setServicioEditar(null);
    setSuccessModal({show: true, message: "Servicio editado correctamente"});
    cargarServicios();
  };

  // ✅ NUEVA FUNCIÓN PARA MANEJAR ELIMINACIÓN
  const handleServicioEliminado = async () => {
    setShowDeleteModal(false);
    setServicioEliminar(undefined);
    setSuccessModal({show: true, message: "Servicio eliminado correctamente"});
    await cargarServicios();
  };

  // ✅ FUNCIÓN PARA ABRIR MODAL DE ELIMINACIÓN
  const handleDeleteClick = (servicio: Servicio) => {
    setServicioEliminar(servicio);
    setShowDeleteModal(true);
  };

  // Función para abrir modal de edición
  const handleEditClick = (servicio: Servicio) => {
    setServicioEditar(servicio);
    setShowEditModal(true);
  };
 

  // Filtrar servicios según búsqueda
  const serviciosFiltrados = servicios.filter(
    (s) =>
      s.servicio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );
  // Ordenar: activos primero, inactivos al final
  const serviciosOrdenados = [...serviciosFiltrados].sort((a, b) => {
  if (a.estado && !b.estado) return -1;
  if (!a.estado && b.estado) return 1;
  return a.servicio.localeCompare(b.servicio);
    });


  // Prepara los datos para la tabla
  const data = serviciosOrdenados.map((s) => ({
    servicio: (
      <span className="fw-bold d-flex align-items-center gap-2">
        <FaCut className="icono-tijera" />
        <span>{s.servicio}</span>
      </span>
    ),
    descripcion: s.descripcion,
    duracion: (
      <>
        <FaClock size={14} className="me-1" />
        {s.duracion}
      </>
    ),
    precio: <>${s.precio}</>,
    estado: (
      <span className={s.estado ? "estado-badge" : "estado-badge-inactivo"}>
        {s.estado ? "Activo" : "Inactivo"}
      </span>
    ),
    acciones: (
      <>
        {/* Verificar permiso para editar servicios */}
        {hasPermission('servicios.edit') && (
          <button 
            className="btn-accion editar" 
            title="Editar"
            onClick={() => handleEditClick(s)}
          >
            <FaEdit />
          </button>
        )}
        
        {/* Verificar permiso para eliminar servicios */}
        {hasPermission('servicios.delete') && (
          <button 
            className="btn-accion eliminar" 
            title="Eliminar"
            onClick={() => handleDeleteClick(s)}
          >
            <FaTrash />
          </button>
        )}
      </>
    ),
  }));

  return (
    <div className="servicio-container">
      <div className="servicio-header">
        <div className="row align-items-center mb-3">
          <div className="col">
            <h1 className="fw-bold mb-0">Servicios</h1>
            <p className="text-secondary mb-0">Gestiona los Servicios de tu peluquería</p>
          </div>
          <div className="col-auto">
            {/* Verificar permiso para crear servicios */}
            {hasPermission('servicios.create') && (
              <button className="nuevo-servicio-btn" onClick={() => setShowModal(true)}>
                + Nuevo Servicio
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="servicio-busqueda">
        <div className="row mb-3">
          <div className="col">
            <input
              className="form-control clientes-busqueda"
              type="text"
              placeholder="Buscar servicio por nombre o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="servicio-tabla-container">
        <Tabla columns={columns} data={data} />
      </div>

      {/* Modal de Nuevo Servicio */}
      <NuevoServicioModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onServicioCreado={handleServicioCreado}
      />

      {/* Modal de Editar Servicio */}
      <EditarServicioModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setServicioEditar(null);
        }}
        servicioEditar={servicioEditar}
        onServicioEditado={handleServicioEditado}
      />

      {/* ✅ NUEVA MODAL DE ELIMINAR SERVICIO */}
      <EliminarServicioModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setServicioEliminar(undefined);
        }}
        servicioToDelete={servicioEliminar}
        onServicioEliminado={handleServicioEliminado}
      />
      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={() => setSuccessModal({show: false, message: ""})}
      />
      
    </div>
  );
}