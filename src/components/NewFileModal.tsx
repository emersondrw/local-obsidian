import React, { useState, useEffect, useRef } from 'react';
import { FilePlus, AlertCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileCreated: (fileName: string) => void;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({ isOpen, onClose, onFileCreated }) => {
  const { createNewFile, filesMap } = useVault();
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFileName(value);

    // Caracteres prohibidos en Windows
    const invalidChars = /[\\/:*?"<>|]/;
    if (invalidChars.test(value)) {
      setErrorMsg('El nombre contiene caracteres inválidos: \\ / : * ? " < > |');
      return;
    }

    if (filesMap.has(`${value}.md`)) {
      setErrorMsg('Ya existe una nota con ese nombre.');
      return;
    }

    setErrorMsg(null);
  };

  const handleCreate = async () => {
    const cleanName = fileName.trim();
    if (!cleanName || errorMsg) return;

    try {
      const createdFileName = await createNewFile(cleanName);
      onFileCreated(createdFileName);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al crear la nota.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fileName.trim() && !errorMsg) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
      <div
        className="bg-slate-900/90 border border-slate-800/85 backdrop-blur-md rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-brand-500/10 transform scale-100 transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <FilePlus className="text-brand-400 w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Crear Nueva Nota</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-normal">
          Las notas se guardan en tu Bóveda local en formato Markdown (.md) y son compatibles con otros editores.
        </p>

        <div className="mb-5">
          <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Nombre del archivo
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={fileName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="Ej. Mi Nota Diaria"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-16 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-200 placeholder-slate-600 transition-all"
            />
            <span className="absolute right-4 top-3 text-xs text-slate-500 font-mono">.md</span>
          </div>
          {errorMsg && (
            <p className="text-[11px] text-rose-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800/80 hover:bg-slate-800 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!fileName.trim() || !!errorMsg}
            className={`px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-lg shadow-md shadow-brand-600/10 transition-all flex items-center gap-1.5 ${
              (!fileName.trim() || !!errorMsg) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Crear Nota
          </button>
        </div>
      </div>
    </div>
  );
};
