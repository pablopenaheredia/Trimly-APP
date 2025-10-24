import { useEffect, useState } from "react";
import "./Clientes.css";
import Tabla from "../components/Tabla";
import EditarClienteModal from "./EditarClienteModal";
import EliminarClienteModal from "../components/EliminarClienteModal";
import NuevoClienteModal from "./NuevoClienteModal";
import SuccessModal from "../components/SuccessModal";
import HistorialClienteModal from "./HistorialClienteModal";
import {
  FaUserCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FaEdit, FaTrash, FaClipboardList } from "react-icons/fa";
import { usePermissions } from "../hooks/usePermissions";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  fechaNacimiento: string;
  activo: boolean;
  visitas?: number; // ✅ Agregar campo para las visitas calculadas
}

// ✅ Interfaces para los datos del historial
interface FacturaDetalle {
  id: number;
  tipo_item: "producto" | "servicio";
  itemId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface FacturaHistorial {
  id: number;
  metodoPago: string;
  estado: string;
  createdAt: string;
  detalles: FacturaDetalle[];
}

const columns = [
  { key: "cliente", label: "Cliente" },
  { key: "contacto", label: "Contacto" },
  { key: "dni", label: "DNI" },
  { key: "fechaNacimiento", label: "Fecha de nacimiento" },
  { key: "visitas", label: "Visitas" },
  { key: "estado", label: "Estado" },
  { key: "acciones", label: "Acciones" },
];

export default function Clientes() {
  // Obtener permisos del usuario
  const { hasPermission } = usePermissions();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | undefined>(
    undefined
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | undefined>(
    undefined
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [clienteHistorial, setClienteHistorial] = useState<Cliente | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Buscar...");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // ✅ Función para calcular visitas igual que en HistorialClienteModal
  const calcularVisitasCliente = async (clienteId: number): Promise<number> => {
    try {
      // Solo cargar facturas del cliente (las visitas reales son las facturadas)
      const facturasRes = await fetch(
        `http://localhost:3000/clientes/${clienteId}/facturas`
      );
      let facturas: FacturaHistorial[] = [];
      if (facturasRes.ok) {
        facturas = await facturasRes.json();
      }

      // Retornar la cantidad de facturas (cada factura = 1 visita)
      return facturas.length;
    } catch (error) {
      console.error(
        `Error calculando visitas para cliente ${clienteId}:`,
        error
      );
      return 0;
    }
  };

  // ✅ Función para cargar clientes CON visitas calculadas
  const fetchClientes = async () => {
    try {
      const res = await fetch("http://localhost:3000/clientes");
      if (!res.ok) throw new Error("No se pudo obtener clientes");
      const data = await res.json();
      const clientesArray = Array.isArray(data) ? data : [];

      // Calcular visitas para cada cliente
      const clientesConVisitas = await Promise.all(
        clientesArray.map(async (cliente: Cliente) => {
          const visitas = await calcularVisitasCliente(cliente.id);
          return { ...cliente, visitas };
        })
      );

      setClientes(clientesConVisitas);
    } catch (error) {
      setClientes([]);
      console.error("Error al cargar clientes:", error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleEditClick = (cliente: Cliente) => {
    setSelectedClient(cliente);
    setShowEditModal(true);
  };

  const handleNewClientClick = () => {
    setShowNewModal(true);
  };

  const handleDeleteClick = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setShowDeleteModal(true);
  };

  const abrirHistorial = (cliente: Cliente) => {
    setClienteHistorial(cliente);
    setMostrarHistorial(true);
  };

  const handleClienteCreado = async () => {
    await fetchClientes(); // ✅ Recalculará las visitas automáticamente
    setSuccessModal({
      show: true,
      message: "Cliente registrado correctamente",
    });
    setShowNewModal(false);
  };

  const handleClienteEditado = async () => {
    await fetchClientes(); // ✅ Recalculará las visitas automáticamente
    setSuccessModal({ show: true, message: "Cliente editado correctamente" });
    setShowEditModal(false);
    setSelectedClient(undefined);
  };

  const handleClienteDesactivado = async () => {
    await fetchClientes(); // ✅ Recalculará las visitas automáticamente
    setSuccessModal({
      show: true,
      message: "Cliente desactivado correctamente",
    });
    setShowDeleteModal(false);
    setClienteToDelete(undefined);
  };

  // --- FILTRADO Y ORDENAMIENTO DE CLIENTES ---
  const clientesPorEstado = mostrarInactivos
    ? clientes.filter((c) => !c.activo)
    : clientes.filter((c) => c.activo);

  const filteredClientes = clientesPorEstado.filter(
    (c) =>
      (c.nombre || "")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()) ||
      (c.apellido || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const sortedAndFilteredClientes = [...filteredClientes].sort((a, b) => {
    return a.nombre.localeCompare(b.nombre);
  });

  const clientesActivos = clientes.filter((c) => c.activo).length;
  const clientesInactivos = clientes.filter((c) => !c.activo).length;

  // --- PREPARACIÓN DE DATOS PARA LA TABLA ---
  const data = sortedAndFilteredClientes.map((c) => ({
    cliente: (
      <span className="d-flex align-items-center gap-2">
        <FaUserCircle size={32} color="#a259ff" />
        <span className="fw-bold">
          {c.nombre} {c.apellido}
        </span>
      </span>
    ),
    contacto: (
      <>
        <FaPhoneAlt size={12} className="me-1" />
        {c.telefono}
        <br />
        <FaEnvelope size={12} className="me-1" />
        {c.email}
      </>
    ),
    dni: c.dni,
    fechaNacimiento: c.fechaNacimiento ? (
      <>
        <FaCalendarAlt size={14} className="me-1" />
        {c.fechaNacimiento}
      </>
    ) : (
      "-"
    ),
    // ✅ Mostrar visitas calculadas con la misma lógica del modal
    visitas: (
      <span
        className={`visitas-badge ${
          (c.visitas || 0) === 0 ? "sin-visitas" : ""
        }`}
      >
        {c.visitas || 0}
      </span>
    ),
    estado: (
      <span
        className={c.activo ? "estado-badge-activo" : "estado-badge-inactivo"}
      >
        {c.activo ? "Activo" : "Inactivo"}
      </span>
    ),
    acciones: (
      <>
        {/* Verificar permiso para editar clientes */}
        {hasPermission('clientes.edit') && (
          <button
            className="btn-accion editar"
            title="Editar"
            onClick={() => handleEditClick(c)}
          >
            <FaEdit />
          </button>
        )}
        
        {/* Verificar permiso para desactivar clientes */}
        {hasPermission('clientes.delete') && (
          <button
            className="btn-accion eliminar"
            title="Desactivar"
            onClick={() => handleDeleteClick(c)}
            disabled={!c.activo}
          >
            <FaTrash />
          </button>
        )}
        
        {/* Historial disponible si puede ver clientes */}
        {hasPermission('clientes.view') && (
          <button
            className="btn-accion historial"
            onClick={() => abrirHistorial(c)}
            title="Ver historial"
          >
            <FaClipboardList />
          </button>
        )}
      </>
    ),
  }));

  return (
    <div className="clientes-container">
      {/* Modales */}
      <NuevoClienteModal
        show={showNewModal}
        onClose={() => setShowNewModal(false)}
        onClienteCreado={handleClienteCreado}
      />
      <EditarClienteModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(undefined);
        }}
        onClienteEditado={handleClienteEditado}
        clienteToEdit={selectedClient}
      />
      <EliminarClienteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClienteToDelete(undefined);
        }}
        clienteToDeactivate={clienteToDelete}
        onClienteDesactivado={handleClienteDesactivado}
      />
      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={() => setSuccessModal({ show: false, message: "" })}
      />
      <HistorialClienteModal
        show={mostrarHistorial}
        onClose={() => setMostrarHistorial(false)}
        cliente={clienteHistorial}
      />

      {/* Encabezado */}
      <div className="clientes-header">
        <div className="row align-items-center mb-3">
          <div className="col">
            <h1 className="fw-bold mb-0">
              {mostrarInactivos ? "Clientes Inactivos" : "Clientes"}
            </h1>
            <p className="text-secondary mb-0">
              {mostrarInactivos
                ? `Mostrando ${clientesInactivos} clientes inactivos`
                : `Mostrando ${clientesActivos} clientes activos`}
            </p>
          </div>
          {!mostrarInactivos && (
            <div className="col-auto">
              {/* Verificar permiso para crear clientes */}
              {hasPermission('clientes.create') && (
                <button
                  className="nuevo-cliente-btn"
                  onClick={handleNewClientClick}
                >
                  + Nuevo cliente
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y botón toggle */}
      <div className="clientes-busqueda-container">
        <div className="row mb-3 align-items-center">
          <div className="col-md-8 col-lg-6">
            <input
              className="form-control clientes-busqueda"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchPlaceholder("")}
              onBlur={() => !searchTerm && setSearchPlaceholder("Buscar...")}
            />
          </div>
          <div className="col-md-4 col-lg-6 d-flex justify-content-end">
            <button
              className={`toggle-inactivos-btn ${
                mostrarInactivos ? "active" : ""
              }`}
              onClick={() => setMostrarInactivos(!mostrarInactivos)}
              title={
                mostrarInactivos
                  ? "Mostrar clientes activos"
                  : "Mostrar clientes inactivos"
              }
            >
              {mostrarInactivos ? (
                <>
                  <FaEye className="me-1" />
                  Ver activos ({clientesActivos})
                </>
              ) : (
                <>
                  <FaEyeSlash className="me-1" />
                  Ver inactivos ({clientesInactivos})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje cuando no hay resultados */}
      {sortedAndFilteredClientes.length === 0 && (
        <div className="text-center py-5">
          <FaUserCircle size={64} className="text-muted mb-3" />
          <h5 className="text-muted">
            {mostrarInactivos
              ? "No hay clientes inactivos"
              : "No se encontraron clientes activos"}
          </h5>
          <p className="text-secondary">
            {searchTerm
              ? `No hay resultados para "${searchTerm}"`
              : mostrarInactivos
              ? "Todos los clientes están activos"
              : "Comienza agregando tu primer cliente"}
          </p>
        </div>
      )}

      {/* Tabla de clientes */}
      <div className="clientes-tabla-container">
        {sortedAndFilteredClientes.length > 0 && (
          <Tabla columns={columns} data={data} />
        )}
      </div>
    </div>
  );
}
