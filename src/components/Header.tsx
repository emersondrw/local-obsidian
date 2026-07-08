import React from 'react';
import { BookOpen, FolderGit, LogOut } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const Header: React.FC = () => {
  const { directoryHandle, selectVault, closeVault } = useVault();

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md py-4 px-6 flex justify-between items-center z-10 shrink-0 h-16">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Personal Vault
          </h1>
          <p className="text-[10px] text-slate-500">Editor de Notas Local 100% Offline</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        {directoryHandle ? (
          <>
            <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Bóveda: {directoryHandle.name}
            </span>
            <div className="h-6 w-[1px] bg-slate-800"></div>
            <button
              onClick={closeVault}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 bg-slate-900/50 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/25 py-1.5 px-3 rounded-lg text-xs font-semibold active:scale-95 transition-all"
              title="Cerrar Bóveda actual"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Bóveda
            </button>
          </>
        ) : (
          <>
            <button
              onClick={selectVault}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-95 transition-all text-white font-semibold py-1.5 px-3.5 rounded-lg shadow-md shadow-brand-600/25 text-xs"
              title="Abre o crea una carpeta local para tu bóveda de notas"
            >
              <FolderGit className="w-3.5 h-3.5" />
              Abrir / Crear Bóveda
            </button>
            <div className="h-6 w-[1px] bg-slate-800"></div>
            <span className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Sin Bóveda
            </span>
          </>
        )}
      </div>
    </header>
  );
};
