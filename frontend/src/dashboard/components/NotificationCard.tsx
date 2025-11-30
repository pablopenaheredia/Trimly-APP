import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NotificationCardProps {
  title: string;
  message: string;
  icon: React.ReactNode;
  variant: 'warning' | 'danger';
  items: Array<{
    id: number;
    nombre?: string;
    stock?: number;
    cliente?: string;
    monto?: number;
    fechaRelativa?: string;
  }>;
  actionText: string;
  actionPath: string;
  type: 'stock' | 'servicios';
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  message,
  icon,
  variant,
  items,
  actionText,
  actionPath,
  type,
}) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div className={`notification-card notification-card-${variant}`}>
      <div className="notification-card-header">
        <div className="notification-card-title-row">
          <div className="notification-card-icon">{icon}</div>
          <div>
            <h3 className="notification-card-title">{title}</h3>
            <p className="notification-card-message">{message}</p>
          </div>
        </div>
        <button
          className={`notification-card-action-btn notification-card-action-btn-${variant}`}
          onClick={() => navigate(actionPath)}
        >
          {actionText}
        </button>
      </div>
      <div className="notification-card-items">
        {visibleItems.map((item) => (
          <div key={item.id} className="notification-card-item">
            {type === "stock" ? (
              <>
                <span className="notification-item-name">{item.nombre}</span>
                <span className="notification-item-stock">
                  {item.stock} unidades
                </span>
              </>
            ) : (
              <>
                <span className="notification-item-name">{item.cliente}</span>
                <div className="notification-item-details">
                  <span className="notification-item-monto">
                    ${item.monto?.toLocaleString('es-AR')}
                  </span>
                  <span className="notification-item-separator">•</span>
                  <span className="notification-item-fecha">{item.fechaRelativa}</span>
                </div>
              </>
            )}
          </div>
        ))}
        {hasMore && !showAll && (
          <button
            className="notification-card-show-more"
            onClick={() => setShowAll(true)}
          >
            +{items.length - 5} {type === 'stock' ? 'productos' : 'servicios'} más...
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
