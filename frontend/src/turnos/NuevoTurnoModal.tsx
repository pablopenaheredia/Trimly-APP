import { useState, useEffect, useRef } from "react";
import "./NuevoTurnoModal.css";
import { FaArrowLeft, FaClock, FaPlus } from "react-icons/fa";
import SuccessModal from "../components/SuccessModal";
import NuevoClienteModal from "../clientes/NuevoClienteModal";
import NuevoServicioModal from "../servicios/NuevoServicioModal";
import NuevoUsuarioModal from "../usuarios/NuevoUsuarioModal";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  activo: boolean;
}

interface Servicio {
  id: number;
  servicio: string;
  estado: boolean;
}

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  rol: string;
  activo: boolean;
}

interface NuevoTurnoModalProps {
  show: boolean;
  onClose: () => void;
  onTurnoCreado: () => Promise<void>;
  clientes: Cliente[];
  servicios: Servicio[];
  usuarios: Usuario[]; // <-- Nuevo prop
}

export default function NuevoTurnoModal({
  show,
  onClose,
  onTurnoCreado,
  clientes,
  servicios,
  usuarios // <-- Nuevo prop
}: NuevoTurnoModalProps) {
  const [cliente, setCliente] = useState("");
  const [servicio, setServicio] = useState("");
  const [usuario, setUsuario] = useState(""); // <-- Nuevo estado
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<{[key:string]: string}>({});
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const timeSelectorRef = useRef<HTMLDivElement>(null);
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  // Estados para modales de creación
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [showNuevoServicioModal, setShowNuevoServicioModal] = useState(false);
  const [showNuevoUsuarioModal, setShowNuevoUsuarioModal] = useState(false);

  // Funciones para recargar datos después de crear entidades
  const handleClienteCreado = async () => {
    await onTurnoCreado(); // Esto recarga todos los datos incluidos los clientes
    setShowNuevoClienteModal(false);
  };

  const handleServicioCreado = async () => {
    await onTurnoCreado(); // Esto recarga todos los datos incluidos los servicios
    setShowNuevoServicioModal(false);
  };

  const handleUsuarioCreado = async () => {
    await onTurnoCreado(); // Esto recarga todos los datos incluidos los usuarios
    setShowNuevoUsuarioModal(false);
  };

  // Cerrar el selector cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeSelectorRef.current && !timeSelectorRef.current.contains(event.target as Node)) {
        setShowTimeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const resetForm = () => {
    setCliente("");
    setServicio("");
    setUsuario(""); // <-- Nuevo reset
    setFecha("");
    setHora("");
    setNotas("");
    setShowTimeSelector(false);
  };

  const handleSuccessModalClose = () => {
    setSuccessModal({ show: false, message: "" });
    resetForm();
    onClose(); // Cerrar el modal principal
  };

  if (!show) return null;

  const handleGuardar = async () => {
    const nuevosErrores: {[key:string]: string} = {};
    if (!cliente) nuevosErrores.cliente = "El cliente es obligatorio";
    if (!servicio) nuevosErrores.servicio = "El servicio es obligatorio";
    if (!usuario) nuevosErrores.usuario = "El profesional es obligatorio"; // <-- Validación usuario
    if (!fecha) nuevosErrores.fecha = "La fecha es obligatoria";
    if (!hora) nuevosErrores.hora = "La hora es obligatoria";
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    const turno = {
      clienteId: Number(cliente),
      servicioId: Number(servicio),
      usuarioId: Number(usuario), // <-- Enviar usuarioId
      fecha,
      hora,
      notas,
    };

    try {
      const response = await fetch("http://localhost:3000/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turno),
      });

      if (response.ok) {
        await onTurnoCreado(); // Recargar los datos
        setSuccessModal({
          show: true,
          message: "Turno creado correctamente"
        });
      } else {
        alert("Error al guardar el turno");
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">

        {/* Encabezado */}
        <div className="modal-header">
          <FaArrowLeft className="back-arrow" onClick={()=>{onClose(); resetForm()}} />
          <div>
            <h2 className="modal-title3">Nuevo Turno</h2>
            <p className="modal-subtitle">Agenda un nuevo turno para un cliente</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label>Cliente</label>
              <div className="input-with-button">
                <select value={cliente} onChange={e => setCliente(e.target.value)}>
                  <option value="">Seleccionar cliente</option>
                  {(clientes || [])
                    .filter(c => c.activo)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="add-button-inline" 
                  onClick={() => setShowNuevoClienteModal(true)}
                  title="Agregar nuevo cliente"
                >
                  <FaPlus />
                </button>
              </div>
              {errores.cliente && <p className="error">{errores.cliente}</p>}
            </div>

            <div className="form-group">
              <label>Servicio</label>
              <div className="input-with-button">
                <select value={servicio} onChange={e => setServicio(e.target.value)}>
                  <option value="">Seleccionar servicio</option>
                  {(servicios || [])
                    .filter(s => s.estado)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.servicio}
                      </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="add-button-inline" 
                  onClick={() => setShowNuevoServicioModal(true)}
                  title="Agregar nuevo servicio"
                >
                  <FaPlus />
                </button>
              </div>
              {errores.servicio && <p className="error">{errores.servicio}</p>}
            </div>

            <div className="form-group">
              <label>Profesional asignado</label>
              <div className="input-with-button">
                <select value={usuario} onChange={e => setUsuario(e.target.value)}>
                  <option value="">Seleccionar profesional</option>
                  {(usuarios || [])
                    .filter(u => u.activo && (u.rol === "empleado" || u.rol === "admin")) // <-- Filtrar correctamente
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido} ({u.rol === "admin" ? "Administrador" : "Empleado"})
                      </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="add-button-inline" 
                  onClick={() => setShowNuevoUsuarioModal(true)}
                  title="Agregar nuevo profesional"
                >
                  <FaPlus />
                </button>
              </div>
              {errores.usuario && <p className="error">{errores.usuario}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              {errores.fecha && <p className="error">{errores.fecha}</p>}
            </div>
            <div className="form-group">
              <label>Hora</label>
              <div className="custom-time-selector" ref={timeSelectorRef}>
                <div 
                  className="time-input-display" 
                  onClick={() => setShowTimeSelector(!showTimeSelector)}
                >
                  <span>{hora || "Seleccionar hora"}</span>
                  <FaClock />
                </div>
                {showTimeSelector && (
                  <div className="time-picker-dropdown">
                    <div className="time-columns">
                      <div className="time-column">
                        <h4>Hora</h4>
                        <div className="time-list">
                          {Array.from({length: 24}, (_, i) => (
                            <div 
                              key={i} 
                              className="time-option"
                              onClick={() => {
                                const minutes = hora.split(':')[1] || '00';
                                const newTime = `${i.toString().padStart(2, '0')}:${minutes}`;
                                setHora(newTime);
                              }}
                            >
                              {i.toString().padStart(2, '0')}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="time-column">
                        <h4>Minutos</h4>
                        <div className="time-list">
                          {Array.from({length: 12}, (_, i) => (
                            <div 
                              key={i} 
                              className="time-option"
                              onClick={() => {
                                const hours = hora.split(':')[0] || '00';
                                const minutes = (i * 5).toString().padStart(2, '0');
                                const newTime = `${hours}:${minutes}`;
                                setHora(newTime);
                              }}
                            >
                              {(i * 5).toString().padStart(2, '0')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="time-actions">
                      <button 
                        type="button"
                        className="time-close-btn" 
                        onClick={() => setShowTimeSelector(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errores.hora && <p className="error">{errores.hora}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Notas adicionales</label>
            <textarea
              rows={2}
              placeholder="Agregar notas o preferencias del cliente..."
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button className="cancel-btn" onClick={()=>{onClose(); resetForm();}}>Cancelar</button>
            <button className="save-btn" onClick={handleGuardar}>Guardar Turno</button>
          </div>
        </div>

      </div>
      
      <SuccessModal 
        show={successModal.show} 
        message={successModal.message} 
        onClose={handleSuccessModalClose} 
      />

      {/* Modales de creación */}
      <NuevoClienteModal 
        show={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        onClienteCreado={handleClienteCreado}
      />

      <NuevoServicioModal
        show={showNuevoServicioModal}
        onClose={() => setShowNuevoServicioModal(false)}
        onServicioCreado={handleServicioCreado}
      />

      <NuevoUsuarioModal
        show={showNuevoUsuarioModal}
        onClose={() => setShowNuevoUsuarioModal(false)}
        onUsuarioCreado={handleUsuarioCreado}
      />
    </div>
  );
}
