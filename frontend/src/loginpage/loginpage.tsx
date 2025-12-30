import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './loginpage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ✅ VERIFICAR SI ESTÁ LOGUEADO AL INICIAR LA APP
  useEffect(() => {
    // Usar el nuevo sistema de autenticación
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // ✅ VALIDACIONES ESPECÍFICAS
    if (!username && !password) {
      setError('El nombre de usuario y la contraseña son requeridos');
      setIsLoading(false);
      return;
    }

    if (!username) {
      setError('El nombre de usuario es requerido');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      setIsLoading(false);
      return;
    }

    try {
      await authService.login({ username, password }, rememberMe);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="formSection">
        <div className="formWrapper">
          {/* Logo y título */}
          <div className="logoSection">
            <div className="logoContainer">
              <div className="logo">
                <span className="logoText">T</span>
              </div>
            </div>
            <h1 className="title">
              Trim<span className="titleGradient">ly</span>
            </h1>
            <p className="subtitle">Tu plataforma de gestión para peluquerías</p>
          </div>

          {/* Formulario de login */}
          <form className="form" onSubmit={handleLogin}>
            {/* Mostrar error si existe */}
            {error && (
              <div className="errorMessage">
                {error}
              </div>
            )}

            {/* Campo Usuario */}
            <div className="inputGroup">
              <label htmlFor="username" className="label">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Ingresa tu nombre de usuario"
                disabled={isLoading}
              />
            </div>

            {/* Campo Contraseña */}
            <div className="inputGroup">
              <label htmlFor="password" className="label">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
              />
            </div>

            {/* Recordar sesión */}
            <div className="formOptions">
              <div className="checkboxGroup">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox"
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="checkboxLabel">
                  Recordar sesión
                </label>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="loginButton"
            >
              {isLoading ? (
                <div className="loadingContent">
                  <div className="spinner"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;