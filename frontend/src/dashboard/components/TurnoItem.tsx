import React from 'react';
import { FaClock } from 'react-icons/fa';
import Badge from './Badge';

interface TurnoItemProps {
  cliente: string;
  servicio: string;
  hora: string;
  estado: 'pendiente' | 'cobrado' | 'cancelado';
}

const TurnoItem: React.FC<TurnoItemProps> = ({ cliente, servicio, hora, estado }) => {
  const getEstadoVariant = () => {
    if (estado === 'cobrado') return 'success';
    if (estado === 'pendiente') return 'warning';
    return 'danger';
  };

  const getEstadoText = () => {
    if (estado === 'cobrado') return 'Confirmado';
    if (estado === 'pendiente') return 'Pendiente';
    return 'Cancelado';
  };

  return (
    <div className="turno-item">
      <div className="turno-item-icon">
        <FaClock size={20} />
      </div>
      <div className="turno-item-info">
        <div className="turno-item-cliente">{cliente}</div>
        <div className="turno-item-details">
          <span className="turno-item-servicio">{servicio}</span>
          <span className="turno-item-separator">•</span>
          <span className="turno-item-hora">{hora.slice(0, 5)}</span>
        </div>
      </div>
      <Badge variant={getEstadoVariant()}>{getEstadoText()}</Badge>
    </div>
  );
};

export default TurnoItem;
