import React, { useState } from 'react';
import { FilePlus, Search, File, Trash2, FolderOpen } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface SidebarProps {
  onNewFileClick: () => void;
  isExpanded?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewFileClick, isExpanded = true }) => {
  const { filesMap, activeFileName, selectFile, deleteFile, directoryHandle } = useVault();
  const [searchQuery, setSearchQuery] = useState('');

  const fileNames = Array.from(filesMap.keys());
  const filteredFiles = fileNames.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render vertical minimalista cuando está colapsado
  if (!isExpanded) {
    return (
      <aside className="w-full h-full border-r border-slate-800/80 bg-slate-900/20 flex flex-col items-center py-4 gap-6 shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors" title="Bóveda Local Colapsada">
          <FolderOpen className="w-4 h-4 text-brand-400" />
        </div>
        {directoryHandle && (
          <button
            onClick={onNewFileClick}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/30 text-slate-400 hover:text-brand-400 transition-all active:scale-95"
            title="Nueva Nota"
          >
            <FilePlus className="w-4 h-4" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-full h-full border-r border-slate-800/80 bg-slate-900/20 flex flex-col shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/50 flex justify-between items-center h-14 shrink-0">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs tracking-wider uppercase">
          <FolderOpen className="w-4 h-4 text-brand-400" />
          <span>Bóveda Local</span>
        </div>
        {directoryHandle && (
          <button
            onClick={onNewFileClick}
            className="text-slate-400 hover:text-brand-400 hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors"
            title="Nueva Nota"
          >
            <FilePlus className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!directoryHandle}
            placeholder="Buscar nota..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-200 placeholder-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Lista de archivos */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {!directoryHandle ? (
          <div className="text-center text-slate-500 text-[11px] mt-12 px-4 leading-normal">
            Abre una carpeta para listar tus notas locales.
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center text-slate-500 text-[11px] mt-12 px-4 leading-normal">
            No se encontraron notas.
          </div>
        ) : (
          filteredFiles.map((fileName) => {
            const isActive = activeFileName === fileName;
            const displayName = fileName.replace('.md', '');

            return (
              <div
                key={fileName}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-300 font-medium border border-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <button
                  onClick={() => selectFile(fileName)}
                  className="flex-1 flex items-center gap-2.5 text-left truncate mr-2"
                >
                  <File className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500 opacity-70'}`} />
                  <span className="truncate">{displayName}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(fileName);
                  }}
                  className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                  title="Eliminar Nota"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
