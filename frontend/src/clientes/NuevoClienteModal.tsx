import React, { useState, useEffect } from "react";
import { FaPhoneAlt, FaEnvelope, FaCalendarAlt } from "react-icons/fa"; // Ya no necesitamos FaCheckCircle
import "./NuevoClienteModal.css"; // Asegúrate de que este archivo CSS existe

// Interfaz para el formulario (lo que enviamos al backend para crear un cliente)
interface NuevoClienteFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  fechaNacimiento: string; // Para creación, la haremos obligatoria
  activo: boolean;
}

// Interfaz para las props del componente
interface Props {
  show: boolean;
  onClose: () => void;
  onClienteCreado: () => Promise<void>; // Aseguramos que el tipo acepte async
}

// Interfaz para el estado de errores
interface FormErrors {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  fechaNacimiento?: string;
  generic?: string; // Para errores generales (ej. de conexión o validación general del servidor)
}

// Interfaz Cliente (para la lista de clientes del backend al verificar duplicados)
interface ClienteExistente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  fechaNacimiento?: string;
  activo: boolean;
}

export default function NuevoClienteModal({
  show,
  onClose,
  onClienteCreado,
}: Props) {
  const [form, setForm] = useState<NuevoClienteFormData>({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    dni: "",
    fechaNacimiento: "",
    activo: true, // Por defecto, un nuevo cliente está activo
  });

  const [errors, setErrors] = useState<FormErrors>({}); // Estado para manejar los mensajes de error
  // const [showSuccessMessage, setShowSuccessMessage] = useState(false); // <--- Eliminamos este estado

  // Resetear el formulario y los errores al abrir el modal
  useEffect(() => {
    if (show) {
      setForm({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        dni: "",
        fechaNacimiento: "",
        activo: true,
      });
      setErrors({});
      // setShowSuccessMessage(false); // <--- Eliminamos esta línea
    }
  }, [show]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    let newValue: string | boolean = value;

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
    const isValid = Object.keys(newErrors).length === 0;
    console.log(
      "Validación de formulario (frontend):",
      isValid ? "PASÓ" : "FALLÓ",
      newErrors
    );
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("1. handleSubmit iniciado.");
    console.log("Datos del formulario antes de validar:", form);

    // 1. Ejecutar validaciones locales (formato, campos vacíos, etc.)
    const isValid = validateForm();
    if (!isValid) {
      console.log("2. Validación de formulario fallida. Deteniendo envío.");
      return;
    }
    console.log("2. Validación de formulario pasada.");

    // 2. Validación de duplicados (DNI, Email y TELÉFONO) haciendo una llamada al backend
    try {
      console.log("3. Iniciando verificación de duplicados...");
      const resClientes = await fetch("http://localhost:3000/clientes");

      if (!resClientes.ok) {
        console.error(
          "4. Error al obtener la lista de clientes para validación de duplicados. Status:",
          resClientes.status
        );
        throw new Error(
          "No se pudo obtener la lista de clientes para validación de duplicados."
        );
      }
      const allClients: ClienteExistente[] = await resClientes.json();
      console.log(
        "4. Lista de clientes obtenida para validación. Total:",
        allClients.length
      );

      // Verificar DNI duplicado
      const dniExists = allClients.some(
        (c: ClienteExistente) => c.dni === form.dni
      );
      if (dniExists) {
        setErrors((prev) => ({
          ...prev,
          dni: "Ya existe un cliente con este DNI.",
        }));
        console.log("5. DNI duplicado encontrado. Deteniendo envío.");
        return;
      }
      console.log("5. DNI no duplicado.");

      // Verificar Email duplicado
      const emailExists = allClients.some(
        (c: ClienteExistente) =>
          c.email.toLowerCase() === form.email.toLowerCase()
      );
      if (emailExists) {
        setErrors((prev) => ({
          ...prev,
          email: "Ya existe un cliente con este email.",
        }));
        console.log("6. Email duplicado encontrado. Deteniendo envío.");
        return;
      }
      console.log("6. Email no duplicado.");

      // Verificar Teléfono duplicado
      const telefonoExists = allClients.some(
        (c: ClienteExistente) => c.telefono === form.telefono
      );
      if (telefonoExists) {
        setErrors((prev) => ({
          ...prev,
          telefono: "Ya existe un cliente con este número de teléfono.",
        }));
        console.log("7. Teléfono duplicado encontrado. Deteniendo envío.");
        return;
      }
      console.log("7. Teléfono no duplicado.");
    } catch (error: any) {
      console.error(
        "8. Error general en la fase de validación de duplicados:",
        error
      );
      setErrors((prev) => ({
        ...prev,
        generic: `Error en la validación de duplicados: ${
          error.message || "desconocido"
        }.`,
      }));
      // Solo setea el error, no muestra alert
      return;
    }

    // Si todas las validaciones pasan, proceder con la creación
    console.log(
      "9. Todas las validaciones de frontend y duplicados pasaron. Enviando al backend..."
    );
    try {
      const res = await fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      console.log(
        "10. Respuesta del servidor recibida. Status:",
        res.status,
        "OK:",
        res.ok
      );

      if (!res.ok) {
        // Mejor manejo de errores: intentar leer el mensaje del backend
        const errorData = await res.json();
        const errorMessage = errorData.message
          ? Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message
          : "Error desconocido";
        setErrors((prev) => ({
          ...prev,
          generic: `Error al crear el cliente: ${errorMessage}`,
        }));
        console.error("11. Error del backend al crear cliente:", errorData);
        return;
      }

      // --- ¡Alerta de éxito, usando el alert nativo como en EliminarClienteModal! ---
      1;
      await onClienteCreado(); // Llama al callback para que la lista de clientes se actualice y muestra el SuccessModal
      onClose(); // Cierra el modal justo después
    } catch (error) {
      console.error(
        "14. Error en la conexión con el servidor (fetch de creación fallido):",
        error
      );
      setErrors((prev) => ({
        ...prev,
        generic: "No se pudo conectar con el servidor.",
      }));
      // Solo setea el error, no muestra alert
    }
  };

  if (!show) return null;

  return (
    <div className="modal-bg">
      <div className="nuevo-cliente-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>{" "}
        {/* Botón de cerrar siempre cierra el modal */}
        <>
          {" "}
          {/* Ya no hay renderizado condicional, siempre mostramos el formulario */}
          <h2 className="modal-title">Nuevo Cliente</h2>
          <p className="modal-subtitle">
            Agrega un nuevo cliente a tu peluquería
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="nuevo-input-group">
                <label>Nombre</label>
                <input
                  name="nombre"
                  placeholder="Ej: María"
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
                  placeholder="Ej: García"
                  value={form.apellido}
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
                  value={form.telefono}
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
                  value={form.email}
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
                  value={form.dni}
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
                    value={form.fechaNacimiento}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.fechaNacimiento && (
                  <span className="error-message">
                    {errors.fechaNacimiento}
                  </span>
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
                  checked={form.activo}
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
                Crear cliente
              </button>
            </div>
          </form>
        </>
      </div>
    </div>
  );
}
