import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEnvelope, FaUserShield } from "react-icons/fa";
import SuccessModal from "../components/SuccessModal"; // Asegúrate de que esta ruta sea correcta
import ErrorModal from "../components/ErrorModal"; // Importamos el ErrorModal
import "./EditarUsuarioModal.css";

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  rol: "admin" | "empleado";
  activo: boolean;
}

interface Props {
  show: boolean;
  onClose: () => void;
  onUsuarioEditado: () => Promise<void>;
  usuarioToEdit?: Usuario;
}

interface FormErrors {
  nombre?: string;
  password?: string;
  rol?: string;
  generic?: string;
}

export default function EditarUsuarioModal({
  show,
  onClose,
  onUsuarioEditado,
  usuarioToEdit,
}: Props) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "",
    activo: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  useEffect(() => {
    if (show && usuarioToEdit) {
      setForm({
        nombre: usuarioToEdit.nombre,
        apellido: usuarioToEdit.apellido || "",
        email: usuarioToEdit.email,
        password: "",
        rol: usuarioToEdit.rol,
        activo: usuarioToEdit.activo,
      });
      setErrors({});
    }
  }, [show, usuarioToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (form.password && form.password.length < 7) {
      newErrors.password =
        "La nueva contraseña debe tener al menos 7 caracteres.";
    } else if (form.password && !/\d/.test(form.password)) {
      newErrors.password =
        "La nueva contraseña debe contener al menos un número.";
    }
    if (!form.rol) newErrors.rol = "El rol es obligatorio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si el formulario no es válido, mostramos el modal con el mensaje de error
    if (!validateForm()) {
      setErrorModal({
        show: true,
        message: "Por favor, corrige los errores en el formulario.",
      });
      return; // No proceder con la edición si hay errores
    }

    setIsSubmitting(true);

    const dataToSend: any = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      rol: form.rol,
      activo: form.activo,
    };

    if (form.password) {
      dataToSend.password = form.password;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/usuarios/${usuarioToEdit!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al editar el usuario.");
      }

      setSuccessModal({
        show: true,
        message: "Usuario editado exitosamente.",
      });

      await onUsuarioEditado();
     
    } catch (error: any) {
      setErrors({
        generic: error.message || "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-bg">
        <div className="editar-usuario-modal-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
          <h2 className="modal-title">Editar Usuario</h2>
          <p className="modal-subtitle">
            Modifica los datos del usuario @{usuarioToEdit?.username}
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="nuevo-input-group">
                <label>Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
                {errors.nombre && (
                  <span className="error-message">{errors.nombre}</span>
                )}
              </div>
              <div className="nuevo-input-group">
                <label>Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="nuevo-input-group input-icon-group">
              <label>Email</label>
              <div className="input-icon-row">
                <FaEnvelope className="input-icon" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="nuevo-input-group input-icon-group">
              <label>Nueva Contraseña (opcional)</label>
              <div className="input-icon-row">
                <FaLock className="input-icon" />
                <input
                  name="password"
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="nuevo-input-group input-icon-group">
              <label>Rol</label>
              <div className="input-icon-row">
                <FaUserShield className="input-icon" />
                <select
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "36px" }}
                >
                  <option value="admin">Administrador</option>
                  <option value="empleado">Empleado</option>
                </select>
              </div>
              {errors.rol && (
                <span className="error-message">{errors.rol}</span>
              )}
            </div>

            <div className="estado-row">
              <div>
                <label className="estado-label">Estado del usuario</label>
                <div className="switch-desc">
                  Usuario activo puede iniciar sesión
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </div>

            {errors.generic && (
              <span className="error-message" style={{ textAlign: "center" }}>
                {errors.generic}
              </span>
            )}

            <div className="form-row buttons">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="create-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={() => {
          setSuccessModal({ show: false, message: "" });
          onClose(); // Cierra la modal principal después de aceptar el SuccessModal
        }}
      />

      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={() => setErrorModal({ show: false, message: "" })}
      />
    </>
  );
}
