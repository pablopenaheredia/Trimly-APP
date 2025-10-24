import { useEffect, useState } from "react";
import "./Usuarios.css";
import Tabla from "../components/Tabla";
import NuevoUsuarioModal from "./NuevoUsuarioModal";
import EditarUsuarioModal from "./EditarUsuarioModal"; // Importar
import EliminarUsuarioModal from "./EliminarUsuarioModal"; // Importar
import {
  FaUserCircle,
  FaEnvelope,
  FaUserShield,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "admin" | "empleado";
  activo: boolean;
  fechaCreacion: string;
}

const columns = [
  { key: "usuario", label: "Usuario" },
  { key: "email", label: "Email" },
  { key: "rol", label: "Rol" },
  { key: "fechaCreacion", label: "Miembro desde" },
  { key: "estado", label: "Estado" },
  { key: "acciones", label: "Acciones" },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false); // Estado para modal de edición
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false); // Estado para modal de eliminación
  const [selectedUser, setSelectedUser] = useState<Usuario | undefined>(
    undefined
  ); // Usuario para editar/eliminar
  const [searchTerm, setSearchTerm] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState(
    "Buscar por nombre, usuario, email..."
  );

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("http://localhost:3000/usuarios");
      if (!res.ok) throw new Error("No se pudo obtener usuarios");
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsuarios([]);
      console.error("Error al cargar usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleEditClick = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setShowEditUserModal(true);
  };

  const handleNewUserClick = () => {
    setShowNewUserModal(true);
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setShowDeleteUserModal(true);
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      (u.nombre || "")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()) ||
      (u.apellido || "")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()) ||
      (u.username || "")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const sortedAndFilteredUsuarios = [...filteredUsuarios].sort((a, b) => {
    if (a.activo && !b.activo) return -1;
    if (!a.activo && b.activo) return 1;
    return a.username.localeCompare(b.username);
  });

  const data = sortedAndFilteredUsuarios.map((u) => ({
    usuario: (
      <span className="d-flex align-items-center gap-2">
        <FaUserCircle size="1.8em" className="text-secondary" />
        <span className="fw-bold">
          {u.nombre} {u.apellido}
          <br />
          <small className="text-secondary">@{u.username}</small>
        </span>
      </span>
    ),
    email: (
      <span className="d-flex align-items-center gap-2 email-cell">
        <FaEnvelope className="text-secondary email-icon" />
        <span className="email-text">{u.email}</span>
      </span>
    ),
    rol: (
      <span className="d-flex align-items-center gap-2 rol-cell">
        <FaUserShield className="text-secondary rol-icon" />
        <span className="rol-text">{u.rol === "admin" ? "Administrador" : "Empleado"}</span>
      </span>
    ),
    fechaCreacion: u.fechaCreacion ? (
      <span className="d-flex align-items-center gap-2">
        <FaCalendarAlt className="text-secondary" />
        {new Date(u.fechaCreacion).toLocaleDateString()}
      </span>
    ) : (
      "-"
    ),
    estado: (
      <span
        className={u.activo ? "estado-badge-activo" : "estado-badge-inactivo"}
      >
        {u.activo ? "Activo" : "Inactivo"}
      </span>
    ),
    acciones: (
      <>
        <button
          className="btn-accion editar"
          title="Editar usuario"
          onClick={() => handleEditClick(u)}
        >
          <FaEdit />
        </button>
        <button
          className="btn-accion eliminar"
          title="Desactivar usuario"
          onClick={() => handleDeleteClick(u)}
          disabled={!u.activo} // Add this line to disable the button for inactive users
        >
          <FaTrash />
        </button>
      </>
    ),
  }));

  return (
    <div className="usuarios-container container-fluid py-4 px-2 px-md-4">
      <NuevoUsuarioModal
        show={showNewUserModal}
        onClose={() => setShowNewUserModal(false)}
        onUsuarioCreado={fetchUsuarios}
      />

      <EditarUsuarioModal
        show={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setSelectedUser(undefined);
        }}
        usuarioToEdit={selectedUser}
        onUsuarioEditado={fetchUsuarios}
      />

      <EliminarUsuarioModal
        show={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false);
          setSelectedUser(undefined);
        }}
        usuarioToDeactivate={selectedUser}
        onUsuarioDesactivado={fetchUsuarios}
      />

      <div className="row align-items-center mb-3">
        <div className="col">
          <h1 className="fw-bold mb-0">Usuarios</h1>
          <p className="text-secondary mb-0">
            Gestiona los usuarios de tu sistema
          </p>
        </div>
        <div className="col-auto">
          <button className="nuevo-usuario-btn" onClick={handleNewUserClick}>
            <FaPlus /> Nuevo usuario
          </button>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col">
          <input
            className="form-control usuarios-busqueda"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchPlaceholder("")}
            onBlur={() =>
              !searchTerm &&
              setSearchPlaceholder("Buscar por nombre, usuario, email...")
            }
          />
        </div>
      </div>

      <Tabla columns={columns} data={data} />
    </div>
  );
}
