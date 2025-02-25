'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Menu } from 'lucide-react'; // Importamos el ícono de hamburguesa

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Navbar principal */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu size={24} />
              </button>
              <Link href="/" className="ml-4 text-xl font-bold text-indigo-600">
                Cooking Cards
              </Link>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="text-gray-700 hover:text-gray-900"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Drawer lateral */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Overlay oscuro */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out ${
            isDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsDrawerOpen(false)}
        />

        {/* Panel del drawer */}
        <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl">
          <div className="h-full flex flex-col">
            {/* Encabezado del drawer */}
            <div className="px-4 py-6 border-b">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-gray-900">Menú</span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido del drawer */}
            <div className="flex-1 overflow-y-auto">
              <nav className="px-2 py-4">
                <Link
                  href="/"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Inicio
                </Link>
                <Link
                  href="/history"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Historial
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Panel Admin
                  </Link>
                )}
              </nav>
            </div>

            {/* Footer del drawer */}
            <div className="border-t px-4 py-4">
              {user && (
                <div className="text-sm text-gray-600">
                  Conectado como: {user.name || user.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;