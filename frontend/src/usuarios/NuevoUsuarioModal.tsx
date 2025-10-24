import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEnvelope, FaUserShield } from "react-icons/fa";
import ErrorModal from "../components/ErrorModal"; // Asegúrate de tener esta importación
import SuccessModal from "../components/SuccessModal"; // Importar SuccessModal
import "./NuevoUsuarioModal.css";

interface NuevoUsuarioFormData {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  rol: "admin" | "empleado" | "";
}

interface Props {
  show: boolean;
  onClose: () => void;
  onUsuarioCreado: () => Promise<void>;
}

interface FormErrors {
  nombre?: string;
  username?: string;
  email?: string;
  password?: string;
  rol?: string;
  generic?: string;
}

interface UsuarioExistente {
  id: number;
  username: string;
  email: string;
}

export default function NuevoUsuarioModal({
  show,
  onClose,
  onUsuarioCreado,
}: Props) {
  const [form, setForm] = useState<NuevoUsuarioFormData>({
    nombre: "",
    apellido: "",
    username: "",
    email: "",
    password: "",
    rol: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  useEffect(() => {
    if (show) {
      setForm({
        nombre: "",
        apellido: "",
        username: "",
        email: "",
        password: "",
        rol: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [show]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!form.username.trim())
      newErrors.username = "El nombre de usuario es obligatorio.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Formato de email inválido.";
    }
    if (!form.password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (form.password.length < 7) {
      newErrors.password = "La contraseña debe tener al menos 7 caracteres.";
    } else if (!/\d/.test(form.password)) {
      newErrors.password = "La contraseña debe contener al menos un número.";
    }
    if (!form.rol) newErrors.rol = "El rol es obligatorio.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setErrorModal({
        show: true,
        message: "Por favor, corrige los errores en el formulario.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/usuarios");
      const existingUsers: UsuarioExistente[] = await res.json();

      const usernameExists = existingUsers.some(
        (u) => u.username.toLowerCase() === form.username.toLowerCase()
      );
      if (usernameExists) {
        setErrors((prev) => ({
          ...prev,
          username: "Este nombre de usuario ya está en uso.",
        }));
        setErrorModal({
          show: true,
          message: "Este nombre de usuario ya está en uso.",
        });
        setIsSubmitting(false);
        return;
      }

      if (form.email) {
        const emailExists = existingUsers.some(
          (u) => u.email && u.email.toLowerCase() === form.email.toLowerCase()
        );
        if (emailExists) {
          setErrors((prev) => ({
            ...prev,
            email: "Este email ya está en uso.",
          }));
          setErrorModal({
            show: true,
            message: "Este email ya está en uso.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Convertir email vacío a null antes de enviar
      const dataToSend = {
        ...form,
        email: form.email || null,
      };

      const createResponse = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message;
        throw new Error(errorMessage || "Error al crear el usuario.");
      }

      // Mostrar el modal de éxito solo después de la creación exitosa
      setSuccessModal({
        show: true,
        message: "Usuario creado exitosamente.",
      });
      await onUsuarioCreado();
      setIsSubmitting(false); // Puedes desactivar el botón de "crear" aquí también
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        generic: error.message || "No se pudo conectar con el servidor.",
      }));
      setErrorModal({
        show: true,
        message: error.message || "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModal({ show: false, message: "" });
    onClose(); // Cierra el modal principal después de aceptar el SuccessModal
  };

  if (!show) return null;

  return (
    <div className="modal-bg">
      <div className="nuevo-usuario-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Nuevo Usuario</h2>
        <p className="modal-subtitle">
          Crea un nuevo perfil de usuario para el sistema
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="nuevo-input-group">
              <label>Nombre</label>
              <input
                name="nombre"
                placeholder="Ej: Juan"
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
                placeholder="Ej: Pérez"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="nuevo-input-group input-icon-group">
            <label>Nombre de usuario</label>
            <div className="input-icon-row">
              <FaUser className="input-icon" />
              <input
                name="username"
                placeholder="Ej: juanperez"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>
          <div className="nuevo-input-group input-icon-group">
            <label>Email (Opcional)</label>
            <div className="input-icon-row">
              <FaEnvelope className="input-icon" />
              <input
                name="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>
          <div className="nuevo-input-group input-icon-group">
            <label>Contraseña</label>
            <div className="input-icon-row">
              <FaLock className="input-icon" />
              <input
                name="password"
                type="password"
                placeholder="Mínimo 7 caracteres, 1 número"
                value={form.password}
                onChange={handleChange}
                required
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
                <option value="" disabled>
                  Selecciona un rol
                </option>
                <option value="admin">Administrador</option>
                <option value="empleado">Empleado</option>
              </select>
            </div>
            {errors.rol && <span className="error-message">{errors.rol}</span>}
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
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
      {/* Mostrar SuccessModal cuando el usuario se crea exitosamente */}
      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={handleSuccessModalClose}  /* Cerrar el modal solo cuando el usuario lo decida */
      />
      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={() => setErrorModal({ show: false, message: "" })}
      />
    </div>
  );
}
