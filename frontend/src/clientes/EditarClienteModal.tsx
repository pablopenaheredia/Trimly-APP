import React, { useState, useEffect } from "react";
import { FaPhoneAlt, FaEnvelope, FaCalendarAlt } from "react-icons/fa";
import "./EditarClienteModal.css";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  fechaNacimiento?: string;
  activo: boolean;
}

interface Props {
  show: boolean;
  onClose: () => void;
  onClienteEditado: () => Promise<void>;
  clienteToEdit?: Cliente;
}

// Interfaz para el estado de errores
interface FormErrors {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  fechaNacimiento?: string;
  generic?: string; // Para errores generales (ej. de conexión o validación general)
}

export default function EditarClienteModal({
  show,
  onClose,
  onClienteEditado,
  clienteToEdit,
}: Props) {
  const [form, setForm] = useState<Partial<Cliente>>({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    dni: "",
    fechaNacimiento: "",
    activo: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Efecto para cargar los datos del cliente a editar o inicializar el formulario
  useEffect(() => {
    if (show) {
      if (clienteToEdit) {
        setForm({
          nombre: clienteToEdit.nombre,
          apellido: clienteToEdit.apellido,
          telefono: clienteToEdit.telefono,
          email: clienteToEdit.email,
          dni: clienteToEdit.dni,
          fechaNacimiento: clienteToEdit.fechaNacimiento
            ? new Date(clienteToEdit.fechaNacimiento)
                .toISOString()
                .split("T")[0]
            : "",
          activo: clienteToEdit.activo,
        });
      } else {
        // Inicializar para "Nuevo Cliente"
        setForm({
          nombre: "",
          apellido: "",
          telefono: "",
          email: "",
          dni: "",
          fechaNacimiento: "",
          activo: true,
        });
      }
      setErrors({}); // Limpiar errores cada vez que la modal se abre
    }
  }, [show, clienteToEdit]);

  // Manejador de cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    let newValue: string | boolean | undefined = value;

    // Convertir a minúsculas para email y otros campos de texto si es necesario
    if (
      name === "email" ||
      (type === "text" && name !== "dni" && name !== "telefono")
    ) {
      newValue = value.toLowerCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }));

    // Limpiar el error de un campo cuando el usuario comienza a escribir en él
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.generic) {
      setErrors((prev) => ({ ...prev, generic: undefined }));
    }
  };

  // Función centralizada de validación en el frontend
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar Nombre
    if (!form.nombre || form.nombre.trim() === "") {
      newErrors.nombre = "El nombre es obligatorio.";
    } else if (form.nombre.length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres.";
    } else if (form.nombre.length > 50) {
      newErrors.nombre = "El nombre no debe exceder los 50 caracteres.";
    }

    // Validar Apellido
    if (!form.apellido || form.apellido.trim() === "") {
      newErrors.apellido = "El apellido es obligatorio.";
    } else if (form.apellido.length < 2) {
      newErrors.apellido = "El apellido debe tener al menos 2 caracteres.";
    } else if (form.apellido.length > 50) {
      newErrors.apellido = "El apellido no debe exceder los 50 caracteres.";
    }

    // Validar Teléfono
    if (!form.telefono || form.telefono.trim() === "") {
      newErrors.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d+$/.test(form.telefono)) {
      // Solo dígitos
      newErrors.telefono = "El teléfono debe contener solo números.";
    } else if (form.telefono.length < 7 || form.telefono.length > 15) {
      newErrors.telefono = "El teléfono debe tener entre 7 y 15 dígitos.";
    }

    // Validar Email
    if (!form.email || form.email.trim() === "") {
      newErrors.email = "El email es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email =
        "Ingresa un formato de email válido (ej. ejemplo@dominio.com).";
    } else if (form.email.length > 100) {
      newErrors.email = "El email no debe exceder los 100 caracteres.";
    }

    // Validar DNI
    if (!form.dni || form.dni.trim() === "") {
      newErrors.dni = "El DNI es obligatorio.";
    } else if (!/^\d+$/.test(form.dni)) {
      // Solo dígitos
      newErrors.dni = "El DNI debe contener solo números.";
    } else if (form.dni.length < 7 || form.dni.length > 10) {
      newErrors.dni = "El DNI debe tener entre 7 y 10 dígitos.";
    }

    // Validar Fecha de Nacimiento
    if (!form.fechaNacimiento || form.fechaNacimiento.trim() === "") {
      newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    } else {
      const selectedDate = new Date(form.fechaNacimiento + "T00:00:00"); // Añadir T00:00:00 para evitar problemas de zona horaria
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Para comparar solo la fecha

      if (isNaN(selectedDate.getTime())) {
        newErrors.fechaNacimiento = "Formato de fecha inválido.";
      } else if (selectedDate > today) {
        newErrors.fechaNacimiento =
          "La fecha de nacimiento no puede ser futura.";
      } else if (selectedDate.getFullYear() < 1900) {
        // Ejemplo de límite inferior
        newErrors.fechaNacimiento =
          "La fecha de nacimiento es demasiado antigua.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true si no hay errores
  };

  // Manejador de envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Ejecutar validaciones locales (formato, campos vacíos, etc.)
    const isValid = validateForm();
    if (!isValid) {
      alert("Por favor, corrige los errores en el formulario.");
      return;
    }

    const isEditing = clienteToEdit !== undefined;
    const url = isEditing
      ? `http://localhost:3000/clientes/${clienteToEdit!.id}`
      : "http://localhost:3000/clientes";
    const method = isEditing ? "PATCH" : "POST";

    // 2. Validación de duplicados (DNI, Email y TELÉFONO) haciendo una llamada al backend
    try {
      const resClientes = await fetch("http://localhost:3000/clientes");
      if (!resClientes.ok) {
        throw new Error(
          "No se pudo obtener la lista de clientes para validación de duplicados."
        );
      }
      const allClients: Cliente[] = await resClientes.json();

      // Verificar DNI duplicado
      const dniExists = allClients.some(
        (c: Cliente) =>
          c.dni === form.dni && (isEditing ? c.id !== clienteToEdit!.id : true)
      );
      if (dniExists) {
        setErrors((prev) => ({
          ...prev,
          dni: "Ya existe un cliente con este DNI.",
        }));
        alert("Ya existe un cliente con este DNI.");
        return;
      }

      // Verificar Email duplicado
      const emailExists = allClients.some(
        (c: Cliente) =>
          c.email.toLowerCase() === form.email!.toLowerCase() &&
          (isEditing ? c.id !== clienteToEdit!.id : true)
      );
      if (emailExists) {
        setErrors((prev) => ({
          ...prev,
          email: "Ya existe un cliente con este email.",
        }));
        alert("Ya existe un cliente con este email.");
        return;
      }

      // NUEVA VALIDACIÓN: Verificar Teléfono duplicado
      const telefonoExists = allClients.some(
        (c: Cliente) =>
          c.telefono === form.telefono &&
          (isEditing ? c.id !== clienteToEdit!.id : true)
      );
      if (telefonoExists) {
        setErrors((prev) => ({
          ...prev,
          telefono: "Ya existe un cliente con este número de teléfono.",
        }));
        alert("Ya existe un cliente con este número de teléfono.");
        return;
      }
    } catch (error: any) {
      console.error("Error al validar duplicados:", error);
      setErrors((prev) => ({
        ...prev,
        generic: `Error en la validación de duplicados: ${
          error.message || "desconocido"
        }.`,
      }));
      alert(
        `No se pudo validar si el cliente ya existe: ${
          error.message || "Error desconocido"
        }. Intenta de nuevo.`
      );
      return;
    }

    // Construcción del objeto de datos para el body (excluyendo 'id')
    const { id, ...dataToSend } = form;

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message
          ? Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message
          : "Error desconocido";
        setErrors((prev) => ({
          ...prev,
          generic: `Error del servidor: ${errorMessage}`,
        }));
        alert(
          `Error al ${
            isEditing ? "editar" : "crear"
          } el cliente: ${errorMessage}.`
        );
        console.error("Detalles del error del backend:", errorData);
        return;
      }

      onClienteEditado(); // Llama a la función de éxito para recargar la lista de clientes
      onClose(); // Cierra el modal
    } catch (error) {
      console.error("Error en la conexión con el servidor:", error);
      setErrors((prev) => ({
        ...prev,
        generic: "No se pudo conectar con el servidor.",
      }));
      alert(
        "No se pudo conectar con el servidor. Por favor, verifica tu conexión."
      );
    }
  };

  if (!show) return null;

  return (
    <div className="modal-bg">
      <div className="editar-cliente-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">
          {clienteToEdit ? "Editar Cliente" : "Nuevo Cliente"}
        </h2>
        <p className="modal-subtitle">
          {clienteToEdit
            ? "Editar los datos del cliente"
            : "Ingresar los datos del nuevo cliente"}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="nuevo-input-group">
              <label>Nombre</label>
              <input
                name="nombre"
                placeholder="Ej: María"
                value={form.nombre || ""}
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
                placeholder="Ej: García"
                value={form.apellido || ""}
                onChange={handleChange}
                required
              />
              {errors.apellido && (
                <span className="error-message">{errors.apellido}</span>
              )}
            </div>
          </div>
          <div className="nuevo-input-group input-icon-group">
            <label>Teléfono</label>
            <div className="input-icon-row">
              <FaPhoneAlt className="input-icon" />
              <input
                name="telefono"
                type="tel"
                placeholder="Ej: 1123456789"
                value={form.telefono || ""}
                onChange={handleChange}
                required
              />
            </div>
            {errors.telefono && (
              <span className="error-message">{errors.telefono}</span>
            )}
          </div>
          <div className="nuevo-input-group input-icon-group">
            <label>Email</label>
            <div className="input-icon-row">
              <FaEnvelope className="input-icon" />
              <input
                name="email"
                type="email"
                placeholder="Ej: cliente@email.com"
                value={form.email || ""}
                onChange={handleChange}
                required
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>
          <div className="form-row">
            <div className="nuevo-input-group">
              <label>DNI</label>
              <input
                name="dni"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{7,10}"
                placeholder="Ej: 12345678"
                value={form.dni || ""}
                onChange={handleChange}
                required
              />
              {errors.dni && (
                <span className="error-message">{errors.dni}</span>
              )}
            </div>
            <div className="nuevo-input-group input-icon-group">
              <label>Fecha de nacimiento</label>
              <div className="input-icon-row">
                <FaCalendarAlt className="input-icon" />
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.fechaNacimiento && (
                <span className="error-message">{errors.fechaNacimiento}</span>
              )}
            </div>
          </div>
          <div className="estado-row">
            <div>
              <label className="estado-label">Estado del cliente</label>
              <div className="switch-desc">
                Cliente activo puede agendar turnos
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                name="activo"
                checked={form.activo ?? true}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
          </div>
          {errors.generic && (
            <span className="error-message">{errors.generic}</span>
          )}
          <div className="form-row buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="create-btn">
              {clienteToEdit ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
