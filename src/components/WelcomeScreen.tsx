import React, { useState } from 'react';
import { FolderHeart, FolderPlus, HelpCircle, ChevronUp, Info } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const WelcomeScreen: React.FC = () => {
  const { selectVault } = useVault();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div id="welcome-screen" className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-30 transition-all duration-500 overflow-y-auto p-6">
      <div className="max-w-xl w-full text-center relative py-12">
        {/* Efecto de brillo de fondo */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-20 left-1/4 w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Icono interactivo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-500/30">
          <FolderHeart className="w-10 h-10 text-white animate-pulse" />
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Bienvenido a tu Bóveda Personal
        </h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-8 leading-relaxed">
          Crea una base de conocimiento local, rápida y segura. Para comenzar, abre una carpeta existente o crea una nueva en tu computadora que servirá como tu <strong className="text-brand-400 font-semibold">Bóveda (Vault)</strong>.
        </p>

        {/* Botones Principales */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-sm mx-auto mb-6">
          <button
            onClick={selectVault}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-95 transition-all text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-brand-600/25 text-xs"
          >
            <FolderPlus className="w-4 h-4" />
            Abrir o Crear Bóveda
          </button>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 transition-all text-slate-300 hover:text-white font-medium py-2.5 px-5 rounded-xl text-xs"
          >
            {showGuide ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ocultar Guía
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4" />
                ¿Cómo crear una Bóveda?
              </>
            )}
          </button>
        </div>

        {/* Guía rápida para crear Vault (oculta por defecto) */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out text-left bg-slate-900/50 backdrop-blur-sm border border-slate-800/40 rounded-xl max-w-md mx-auto ${
            showGuide ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 text-[11px] text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-200 text-xs mb-1.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-400" />
              Instrucciones de Creación Local
            </h4>
            <p>Debido a políticas de seguridad del navegador, para crear un nuevo Vault debes:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Hacer clic en el botón <strong className="text-slate-200">"Abrir o Crear Bóveda"</strong>.</li>
              <li>En el explorador de archivos, ve a la carpeta donde quieras ubicar tus notas (ej: tu Escritorio o Documentos).</li>
              <li>Haz clic derecho en un espacio vacío y selecciona <strong className="text-slate-200">Nuevo &gt; Carpeta</strong> (o usa el botón del explorador).</li>
              <li>Nómbrala como quieras (ej. <code className="bg-slate-950 px-1 py-0.5 rounded text-brand-300">Mi Boveda</code>).</li>
              <li>Selecciona esa carpeta y haz clic en <strong className="text-slate-200">"Seleccionar carpeta"</strong>.</li>
              <li>Otorga permisos de edición en la alerta emergente del navegador.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
