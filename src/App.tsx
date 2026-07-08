import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TipTapEditor } from './components/TipTapEditor';
import { D3Graph } from './components/D3Graph';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NewFileModal } from './components/NewFileModal';
import { Share2, ChevronRight, ChevronLeft } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { directoryHandle, selectFile } = useVault();
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isGraphExpanded, setIsGraphExpanded] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col relative select-none">
      {/* Cabecera Principal */}
      <Header />

      {/* Workspace Principal */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Barra Lateral de Archivos (Colapsable) */}
        <div className={`relative flex transition-all duration-300 ${isSidebarExpanded ? 'w-72' : 'w-12'} shrink-0 h-full`}>
          <Sidebar onNewFileClick={() => setIsNewFileModalOpen(true)} isExpanded={isSidebarExpanded} />
          
          {/* Botón para alternar Sidebar */}
          {directoryHandle && (
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-white shadow-md active:scale-95 transition-all z-10"
              title={isSidebarExpanded ? "Colapsar Barra Lateral" : "Expandir Barra Lateral"}
            >
              {isSidebarExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Panel Central del Editor */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative min-h-0 border-r border-slate-800/40">
          <TipTapEditor />
        </main>

        {/* Panel Lateral Derecho: Vista de Conexiones (Grafo) */}
        {directoryHandle && (
          <aside
            className={`border-l border-slate-800/80 bg-slate-900/10 flex flex-col shrink-0 relative transition-all duration-300 ${
              isGraphExpanded ? 'w-80 sm:w-96' : 'w-12'
            }`}
          >
            {/* Botón para alternar visibilidad del Grafo */}
            <button
              onClick={() => setIsGraphExpanded(!isGraphExpanded)}
              className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-white shadow-md active:scale-95 transition-all z-10"
              title={isGraphExpanded ? "Colapsar Grafo" : "Expandir Grafo"}
            >
              {isGraphExpanded ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {isGraphExpanded ? (
              <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                {/* Header del Grafo */}
                <div className="h-14 border-b border-slate-800/50 px-4 flex items-center gap-2 text-slate-300 font-semibold text-xs tracking-wider uppercase shrink-0">
                  <Share2 className="w-4 h-4 text-brand-400 animate-pulse" />
                  <span>Vista de Conexiones</span>
                </div>
                {/* Grafo Canvas/D3 */}
                <div className="flex-1 relative flex items-center justify-center bg-slate-950/40 min-h-0">
                  <D3Graph />
                  <div className="absolute bottom-3 text-center w-full pointer-events-none px-4">
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                      Grafo interactivo indexando WikiLinks de forma real. Clic en los nodos para navegar.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center pt-16 gap-4 text-slate-500">
                <Share2 className="w-4 h-4 rotate-90" />
                <span className="text-[10px] uppercase tracking-widest [writing-mode:vertical-lr] font-bold">
                  Grafo
                </span>
              </div>
            )}
          </aside>
        )}

        {/* Pantalla de Bienvenida Inicial */}
        {!directoryHandle && <WelcomeScreen />}
      </div>

      {/* Modal interactivo de creación de notas */}
      <NewFileModal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        onFileCreated={async (fileName) => {
          // Seleccionar de inmediato la nota creada
          await selectFile(fileName);
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <VaultProvider>
      <MainLayout />
    </VaultProvider>
  );
};

export default App;
