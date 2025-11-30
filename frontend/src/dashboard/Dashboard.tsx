import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendar,
  FaDollarSign,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaEye,
  FaBox,
  FaCreditCard,
  FaBell,
} from 'react-icons/fa';
import MetricCard from './components/MetricCard';
import Badge from './components/Badge';
import TurnoItem from './components/TurnoItem';
import NotificationCard from './components/NotificationCard';
import { useClock } from './hooks/useClock';
import { useDashboardData } from './hooks/useDashboardData';
import { usePermissions } from '../hooks/usePermissions';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { formatearHora, formatearFecha } = useClock();
  const { metricas, proximosTurnos, notificaciones, cargando, error } = useDashboardData();
  const { hasPermission } = usePermissions();

  // Verificar si puede ver información financiera
  const canViewFinancials = hasPermission('dashboard.financials');

  if (cargando) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">{formatearFecha()}</p>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-clock">{formatearHora()}</div>
          <button
            className="dashboard-nuevo-turno-btn"
            onClick={() => navigate('/turnos')}
          >
            <FaPlus /> Nuevo Turno
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="dashboard-metrics-grid">
        {/* Turnos de Hoy */}
        <MetricCard
          title="Turnos de Hoy"
          value={metricas?.turnosHoy.total || 0}
          icon={<FaCalendar size={24} />}
          iconBgColor="rgba(0, 230, 230, 0.15)"
        >
          <div className="metric-card-badges">
            <Badge variant="success">
              {metricas?.turnosHoy.completados || 0} Completados
            </Badge>
            <Badge variant="info">
              {metricas?.turnosHoy.pendientes || 0} Pendientes
            </Badge>
          </div>
        </MetricCard>

        {/* Ingresos de Hoy - Solo para usuarios con permisos financieros */}
        {canViewFinancials && (
          <MetricCard
            title="Ingresos de Hoy"
            value={`$${(metricas?.ingresosHoy.monto || 0).toLocaleString('es-AR')}`}
            icon={<FaDollarSign size={24} />}
            iconBgColor="rgba(139, 71, 238, 0.15)"
          />
        )}

        {/* Clientes Atendidos */}
        <MetricCard
          title="Clientes Atendidos"
          value={metricas?.clientesHoy.total || 0}
          icon={<FaUsers size={24} />}
          iconBgColor="rgba(0, 230, 230, 0.15)"
        >
          <div className="metric-card-secondary">
            <span>{metricas?.clientesHoy.atendidos || 0} Atendidos</span>
            <span className="metric-separator">•</span>
            <span>{canViewFinancials ? `${metricas?.clientesHoy.facturados || 0} Facturados` : 'N/A'}</span>
          </div>
        </MetricCard>

        {/* Resumen Semanal - Solo para usuarios con permisos financieros */}
        {canViewFinancials && (
          <MetricCard
            title="Resumen Semanal"
            value={`$${(metricas?.resumenSemanal.ingresos || 0).toLocaleString('es-AR')}`}
            icon={<FaChartLine size={24} />}
            iconBgColor="rgba(139, 71, 238, 0.15)"
          >
            <div className="metric-card-secondary">
              <span>{metricas?.resumenSemanal.turnos || 0} Turnos</span>
              <span className="metric-separator">•</span>
              <span>{metricas?.resumenSemanal.servicios || 0} Servicios</span>
              <span className="metric-separator">•</span>
              <span>{metricas?.resumenSemanal.productos || 0} Productos</span>
            </div>
          </MetricCard>
        )}
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom-section">
        {/* Próximos Turnos */}
        <div className="dashboard-section dashboard-turnos-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Próximos Turnos del Día</h2>
            <button
              className="dashboard-section-action"
              onClick={() => navigate('/turnos')}
            >
              Ver todos <FaEye />
            </button>
          </div>
          <div className="dashboard-turnos-list">
            {proximosTurnos.map((turno) => (
              <TurnoItem
                key={turno.id}
                cliente={turno.cliente.nombre}
                servicio={turno.servicio}
                hora={turno.hora}
                estado={turno.estado}
              />
            ))}
          </div>
        </div>

        {/* Notificaciones */}
        <div className="dashboard-section dashboard-notifications-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">
              <FaBell /> Notificaciones
            </h2>
          </div>
          <div className="dashboard-notifications-list">
            {/* Stock Bajo */}
            {notificaciones && notificaciones.stockBajo.cantidad > 0 && (
              <NotificationCard
                title="Stock bajo en productos"
                message={`${notificaciones.stockBajo.cantidad} productos con stock crítico`}
                icon={<FaBox size={20} />}
                variant="warning"
                items={notificaciones.stockBajo.productos}
                actionText="Ver detalles"
                actionPath="/stock"
                type="stock"
              />
            )}

            {/* Servicios Sin Pagar - Solo para usuarios con permisos financieros */}
            {canViewFinancials && notificaciones && notificaciones.serviciosSinPagar.cantidad > 0 && (
              <NotificationCard
                title="Servicios pendientes de pago"
                message={`${notificaciones.serviciosSinPagar.cantidad} servicios realizados sin cobrar`}
                icon={<FaCreditCard size={20} />}
                variant="danger"
                items={notificaciones.serviciosSinPagar.servicios}
                actionText="Ver detalles"
                actionPath="/reportes"
                type="servicios"
              />
            )}

            {notificaciones &&
              notificaciones.stockBajo.cantidad === 0 &&
              (!canViewFinancials || notificaciones.serviciosSinPagar.cantidad === 0) && (
                <div className="dashboard-no-data">
                  No hay notificaciones pendientes
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
