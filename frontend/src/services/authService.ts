// Servicio de autenticación y gestión de roles
import { API_URL } from '../config/api';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'empleado';
  activo: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'trimly_token';
  private readonly USER_KEY = 'trimly_user';

  // Hacer login
  async login(credentials: LoginCredentials, remember = true): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let message = 'Credenciales inválidas';
        try {
          const body = await response.json();
          if (typeof body?.message === 'string') message = body.message;
          if (Array.isArray(body?.message)) message = body.message.join(', ');
        } catch {
          // ignore JSON parsing errors
        }
        throw new Error(message);
      }

      const data: AuthResponse = await response.json();
      
  // Guardar token y usuario según la preferencia de "remember"
  this.setAuthData(data.token, data.user, remember);

      return data;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Error al iniciar sesión');
    }
  }

  // Guardar token y usuario en localStorage o sessionStorage según "remember"
  setAuthData(token: string, user: User, remember = true): void {
    // Primero limpiar cualquier valor previo
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch {}

    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    } catch {}

    if (remember) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  // Hacer logout
  logout(): void {
    // Eliminar de ambos storages
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch {}

    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    } catch {}
    window.location.href = '/login';
  }

  // Obtener token actual
  getToken(): string | null {
    // Primero buscar en localStorage (persistente), luego en sessionStorage (temporal)
    const fromLocal = localStorage.getItem(this.TOKEN_KEY);
    if (fromLocal) return fromLocal;

    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Obtener rol del usuario actual
  getUserRole(): 'admin' | 'empleado' | null {
    const user = this.getCurrentUser();
    return user?.rol || null;
  }

  // Verificar si es admin
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // Verificar si es empleado
  isEmpleado(): boolean {
    return this.getUserRole() === 'empleado';
  }

  // Verificar si tiene acceso a una sección específica
  canAccessSection(section: string): boolean {
    const role = this.getUserRole();
    if (!role) return false;

    // Admin tiene acceso a todo
    if (role === 'admin') return true;

    // Empleado: definir accesos específicos
    const empleadoAccess: Record<string, boolean> = {
      'dashboard': true,
      'servicios': true,
      'turnos': true,
      'clientes': true,
      'productos': true,
      'facturacion': true,
      'reportes': false,
      'usuarios': false,
      'configuracion': false,
    };

    return empleadoAccess[section] || false;
  }

  // Verificar permisos específicos
  hasPermission(permission: string): boolean {
    const role = this.getUserRole();
    if (!role) return false;

    // Admin tiene todos los permisos
    if (role === 'admin') return true;

    // Empleado: definir permisos específicos
    const empleadoPermissions: Record<string, boolean> = {
      // Dashboard
      'dashboard.view': true,
      'dashboard.financials': false,

      // Servicios
      'servicios.view': true,
      'servicios.create': true,
      'servicios.edit': true,
      'servicios.delete': false,

      // Turnos
      'turnos.view': true,
      'turnos.create': true,
      'turnos.edit': true,
      'turnos.delete': true,
      'turnos.assign': true,

      // Clientes
      'clientes.view': true,
      'clientes.create': true,
      'clientes.edit': true,
      'clientes.delete': false,

      // Productos
      'productos.view': true,
      'productos.create': true,
      'productos.edit': true,
      'productos.edit.stock': false,
      'productos.delete': false,

      // Facturación
      'facturacion.view': true,
      'facturacion.create': true,
      'facturacion.reportes': false,

      // Reportes
      'reportes.view': false,
      'reportes.generate': false,

      // Usuarios
      'usuarios.view': false,
      'usuarios.create': false,
      'usuarios.edit': false,
      'usuarios.delete': false,
    };

    return empleadoPermissions[permission] || false;
  }

  // Actualizar información del usuario
  updateUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Verificar si el token es válido (opcional, para validación en servidor)
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logout(); // Token inválido, hacer logout
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService();
export default authService;