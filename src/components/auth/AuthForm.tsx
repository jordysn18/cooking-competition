'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ type: initialType }) => {
  const [type, setType] = useState<'login' | 'register'>(initialType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, error } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Comprobar inicialmente
    checkIfMobile();
    
    // Agregar evento para comprobar cuando cambie el tamaño de la ventana
    window.addEventListener('resize', checkIfMobile);
    
    // Limpiar evento
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password, name);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Usar la imagen de fondo apropiada según el dispositivo
  const backgroundImage = isMobile 
    ? "url('/mobileBackground.jpg')" 
    : "url('/desktopBackground.jpg')";

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage }}
    >
      <div className="w-full max-w-md p-6 sm:p-8 bg-white bg-opacity-90 rounded-lg shadow-xl">
        {/* Tabs para cambiar entre iniciar sesión y registrarse */}
        <div className="flex mb-6 border-b">
          <button 
            className={`flex-1 py-3 font-medium text-center ${type === 'login' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500'}`}
            onClick={() => setType('login')}
          >
            Iniciar Sesión
          </button>
          <button 
            className={`flex-1 py-3 font-medium text-center ${type === 'register' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500'}`}
            onClick={() => setType('register')}
          >
            Registrarse
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-600 mb-6">
          {type === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {type === 'register' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-red-600 mb-1">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-red-600 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-red-600 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-600"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {type === 'login' && (
            <div className="text-right">
              <a href="#" className="text-sm text-red-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              {type === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;