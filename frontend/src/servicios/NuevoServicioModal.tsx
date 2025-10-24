import React, { useState } from "react";
import "./NuevoServicioModal.css";

interface Props {
  show: boolean;
  onClose: () => void;
  onServicioCreado: () => void;
}

export default function NuevoServicioModal({ show, onClose, onServicioCreado }: Props) {
  const [form, setForm] = useState({
    servicio: "",
    descripcion: "",
    duracion: "",
    precio: "",
    estado: true,
  });

  const resetForm = () => {
    setForm({
      servicio: "",
      descripcion: "",
      duracion: "",
      precio: "",
      estado: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue = value;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/servicios");
      const servicios = await res.json();
      const existe = servicios.some(
        (s: any) => s.servicio.trim().toLowerCase() === form.servicio.trim().toLowerCase()
      );
      if (existe) {
        alert("Ya existe un servicio con ese nombre.");
        return;
      }
    } catch (error) {
      alert("No se pudo validar si el servicio ya existe.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duracion: Number(form.duracion),
          precio: parseFloat(form.precio),
          estado: true,
        }),
      });
      if (!res.ok) {
        alert("Error al crear el servicio. Verifica los datos o el servidor.");
        return;
      }
      onServicioCreado();
      resetForm(); // 👉 limpiar campos
      onClose();
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  if (!show) return null;

  return (
    <div className="modal-bg">
      <div className="nuevo-servicio-modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="modal-title">Nuevo Servicio</h2>
        <p className="modal-subtitle">Agrega un nuevo servicio a tu peluquería</p>
        <form onSubmit={handleSubmit}>
          <div className="nuevo-input-group">
            <label>Servicio</label>
            <input
              name="servicio"
              placeholder="Ej: Corte de pelo"
              value={form.servicio}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="nuevo-input-group">
              <label>Duración (minutos)</label>
              <input
                name="duracion"
                type="number"
                min="1"
                step="1"
                placeholder="Ej: 45"
                value={form.duracion}
                onChange={handleChange}
                required
              />
            </div>
            <div className="nuevo-input-group">
              <label>Precio</label>
              <input
                name="precio"
                type="number"
                min="1"
                step="0.01"
                placeholder="Ej: 1500"
                value={form.precio}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="nuevo-input-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              placeholder="Describe el servicio"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={2}
            />
          </div>
          <div className="estado-row">
            <div>
              <label className="estado-label">Estado del servicio</label>
              <div className="switch-desc">Servicio activo puede ser reservado</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={true}
                disabled
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="form-row buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="create-btn">Crear servicio</button>
          </div>
        </form>
      </div>
    </div>
  );
}
