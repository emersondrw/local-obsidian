import React, { useEffect, useState, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { Heading1, Heading2, Heading3, CheckSquare, Bold, Link as LinkIcon, Calendar, Code, Save, Eye, Edit3 } from 'lucide-react';

// --- PROCESADOR DE MARKDOWN A HTML (NATIVO OFFLINE) ---
function renderMarkdownToHtml(text: string, imagesMap: Map<string, string>): string {
  if (!text) return '<p class="text-slate-500 italic">Documento vacío</p>';
  
  let cleanText = text;
  
  // Remover YAML Frontmatter de la previsualización visual
  if (text.startsWith('---')) {
    const parts = text.split('---');
    if (parts.length >= 3) {
      cleanText = parts.slice(2).join('---').trim();
    }
  }

  // Escapar HTML básico
  let html = cleanText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bloques de código
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 border border-slate-800/60 p-4 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto my-4">$1</pre>');

  // Cabeceras
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-extrabold border-b border-slate-800/80 pb-2 mb-4 mt-2 text-white">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-slate-100">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-slate-200">$1</h3>');

  // Listas de tareas
  html = html.replace(/^- \[ \] (.*?)$/gm, '<div class="flex items-center gap-2 mb-2"><input type="checkbox" disabled class="rounded border-slate-800 bg-slate-950 text-brand-500 focus:ring-0 w-4 h-4"> <span class="text-slate-300 text-sm">$1</span></div>');
  html = html.replace(/^- \[x\] (.*?)$/gm, '<div class="flex items-center gap-2 mb-2"><input type="checkbox" checked disabled class="rounded border-slate-800 bg-slate-950 text-brand-500 focus:ring-0 w-4 h-4"> <span class="text-slate-400 text-sm line-through opacity-70">$1</span></div>');

  // Listas normales
  html = html.replace(/^- (.*?)$/gm, '<ul class="list-disc pl-5 mb-3"><li class="text-slate-300 text-sm">$1</li></ul>');
  // Combinar listas consecutivas
  html = html.replace(/<\/ul>\s*<ul class="list-disc pl-5 mb-3">/g, '');

  // Negritas
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // WikiLinks de Imágenes ![[imagen.png]]
  html = html.replace(/!\[\[(.*?)\]\]/g, (_, imageName) => {
    const cleanName = imageName.trim();
    const objectUrl = imagesMap.get(cleanName);
    if (objectUrl) {
      return `<img src="${objectUrl}" alt="${cleanName}" class="rounded-xl max-w-full my-4 border border-slate-800/60 shadow-lg max-h-[400px] object-contain mx-auto" />`;
    }
    return `<div class="bg-slate-900 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-500 italic my-4 flex items-center justify-center gap-2 select-none"><span class="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></span> Imagen "${cleanName}" no encontrada en la Bóveda</div>`;
  });

  // WikiLinks [[Nota]] a enlaces interactivos
  html = html.replace(/\[\[(.*?)\]\]/g, '<a class="wiki-link text-brand-400 hover:text-brand-300 font-semibold underline decoration-brand-500/30 cursor-pointer" data-target="$1">[[$1]]</a>');

  // Párrafos y saltos de línea
  const lines = html.split('\n');
  const blockTags = ['<h1>', '<h2>', '<h3>', '<ul', '<ol', '<pre', '<p', '<div'];
  
  html = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    const isBlock = blockTags.some(tag => trimmed.startsWith(tag));
    if (isBlock) return line;
    return `<p class="mb-3 text-slate-300 text-sm leading-relaxed">${line}</p>`;
  }).join('\n');

  return html;
}

export const TipTapEditor: React.FC = () => {
  const { activeFileName, activeFileContent, saveActiveFile, isModified, isSaving, setModified, filesMap, selectFile, createNewFile, directoryHandle, imagesMap, scanVault } = useVault();
  const [markdownText, setMarkdownText] = useState('');
  const [slashMenu, setSlashMenu] = useState<{ visible: boolean; x: number; y: number; query: string; startPos: number }>({
    visible: false,
    x: 0,
    y: 0,
    query: '',
    startPos: 0
  });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Definición de Comandos de Barra Diagonal
  const slashCommands = [
    { key: 'h1', label: 'Título 1 (Grande)', snippet: '# ', desc: '# título', icon: Heading1 },
    { key: 'h2', label: 'Título 2 (Mediano)', snippet: '## ', desc: '## título', icon: Heading2 },
    { key: 'h3', label: 'Título 3 (Pequeño)', snippet: '### ', desc: '### título', icon: Heading3 },
    { key: 'todo', label: 'Lista de Tareas', snippet: '- [ ] ', desc: '- [ ] tarea', icon: CheckSquare },
    { key: 'bold', label: 'Texto en Negrita', snippet: '**texto**', desc: '**negrita**', icon: Bold },
    { key: 'link', label: 'Enlace a Nota', snippet: '[[Nota]]', desc: '[[Nota]]', icon: LinkIcon },
    { key: 'date', label: 'Fecha Actual', snippet: () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, desc: 'AAAA-MM-DD', icon: Calendar },
    { key: 'code', label: 'Bloque de Código', snippet: '```\n\n```', desc: '``` código ```', icon: Code }
  ];

  const lastLoadedFileRef = useRef<string | null>(null);

  // Sincronizar el editor únicamente cuando cambia el archivo seleccionado
  useEffect(() => {
    if (activeFileName && activeFileName !== lastLoadedFileRef.current) {
      setMarkdownText(activeFileContent);
      lastLoadedFileRef.current = activeFileName;
      setSlashMenu(prev => ({ ...prev, visible: false }));
    }
  }, [activeFileName, activeFileContent]);

  // Manejar clics de navegación en WikiLinks de la vista previa de forma nativa e insensible a mayúsculas/tildes
  useEffect(() => {
    const previewEl = previewRef.current;
    if (!previewEl) return;

    const handleNativeClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const wikiLink = target.closest('.wiki-link');
      if (!wikiLink) return;

      e.preventDefault();
      e.stopPropagation();

      const noteName = wikiLink.getAttribute('data-target');
      if (!noteName) return;

      const targetName = `${noteName.trim()}.md`;

      // Helper para buscar coincidencia tolerante a mayúsculas, minúsculas y acentos (tildes)
      const findCaseAndAccentInsensitiveMatch = () => {
        const normalizeStr = (str: string) => 
          str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const normalizedTarget = normalizeStr(targetName);

        for (const key of filesMap.keys()) {
          if (normalizeStr(key) === normalizedTarget) {
            return key;
          }
        }
        return null;
      };

      const matchedFileName = findCaseAndAccentInsensitiveMatch();

      if (matchedFileName) {
        await selectFile(matchedFileName);
      } else {
        const create = window.confirm(`La nota "${noteName}" no existe en tu Bóveda. ¿Deseas crearla ahora?`);
        if (create) {
          try {
            const newName = await createNewFile(noteName);
            await selectFile(newName);
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    previewEl.addEventListener('click', handleNativeClick);
    return () => {
      previewEl.removeEventListener('click', handleNativeClick);
    };
  }, [markdownText, filesMap, selectFile, createNewFile]);

  // Manejar el cambio de texto en el textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMarkdownText(val);
    setModified(true);
  };

  // Capturar imágenes desde el portapapeles y guardarlas físicamente en la bóveda
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !directoryHandle) return;

    let imageItem = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageItem = items[i];
        break;
      }
    }

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      const timestamp = Date.now();
      const imageName = `Pasted_image_${timestamp}.png`;

      try {
        // Crear el archivo en la raíz de la bóveda
        const fileHandle = await directoryHandle.getFileHandle(imageName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        // Insertar en la posición actual del cursor usando la sintaxis ![[imagen.png]]
        const textarea = textareaRef.current;
        if (textarea) {
          const value = textarea.value;
          const caretPos = textarea.selectionStart;
          const imageMarkdown = `\n![[${imageName}]]\n`;

          const before = value.substring(0, caretPos);
          const after = value.substring(textarea.selectionEnd);

          const newText = before + imageMarkdown + after;
          setMarkdownText(newText);
          setModified(true);

          // Escanear la bóveda en segundo plano para indexar la nueva imagen dinámicamente
          await scanVault();

          // Devolver el foco al cursor
          setTimeout(() => {
            textarea.focus();
            const newCursorPos = caretPos + imageMarkdown.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 50);
        }
      } catch (err) {
        console.error("Error al pegar la imagen del portapapeles:", err);
        alert(`Error al guardar la imagen pegada: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  // Posicionar el menú de barra diagonal "/"
  const positionSlashMenu = (slashIndex: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const textBeforeSlash = value.substring(0, slashIndex);
    const lines = textBeforeSlash.split('\n');
    const lineCount = lines.length;
    const lastLineCharCount = lines[lines.length - 1].length;

    // Medidas aproximadas basadas en Tailwind font-mono text-sm leading-relaxed
    const lineHeight = 22.75;
    const charWidth = 8.4;
    const paddingOffset = 24; // p-6 = 24px

    let top = (lineCount * lineHeight) - textarea.scrollTop + paddingOffset + 5;
    let left = (lastLineCharCount * charWidth) + paddingOffset;

    const editorWidth = textarea.clientWidth;
    const editorHeight = textarea.clientHeight;

    // Limitar bordes
    if (left + 240 > editorWidth) {
      left = editorWidth - 260;
    }
    if (top + 220 > editorHeight) {
      top = top - 250;
    }

    setSlashMenu(prev => ({
      ...prev,
      x: Math.max(10, left),
      y: Math.max(10, top)
    }));
  };

  // Aplicar un comando rápido "/"
  const applyCommand = (cmd: typeof slashCommands[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const caretPos = textarea.selectionStart;
    const snippet = typeof cmd.snippet === 'function' ? cmd.snippet() : cmd.snippet;

    const before = value.substring(0, slashMenu.startPos);
    const after = value.substring(caretPos);

    const newText = before + snippet + after;
    setMarkdownText(newText);
    setModified(true);

    // Ajustar el foco y cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = slashMenu.startPos + snippet.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);

    setSlashMenu(prev => ({ ...prev, visible: false }));
  };

  // Manejo de eventos del teclado en el textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (slashMenu.visible) {
      const filtered = slashCommands.filter(cmd =>
        cmd.key.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
        cmd.label.toLowerCase().includes(slashMenu.query.toLowerCase())
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedCommandIndex]) {
          applyCommand(filtered[selectedCommandIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenu(prev => ({ ...prev, visible: false }));
      }
    } else {
      // Atajo Ctrl + S para guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key) && slashMenu.visible) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const caretPos = textarea.selectionStart;

    const textBeforeCaret = value.substring(0, caretPos);
    const lastSlashIndex = textBeforeCaret.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCaret.charAt(lastSlashIndex - 1) : '\n';
      const isStart = [' ', '\n', '\r', '\t'].includes(charBeforeSlash);

      const queryText = textBeforeCaret.substring(lastSlashIndex + 1);
      const hasNewLine = /[\n\r]/.test(queryText);

      if (isStart && !hasNewLine && queryText.length < 10) {
        setSlashMenu({
          visible: true,
          x: 0,
          y: 0,
          query: queryText,
          startPos: lastSlashIndex
        });
        positionSlashMenu(lastSlashIndex);
        setSelectedCommandIndex(0);
        return;
      }
    }

    setSlashMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSave = async () => {
    if (!activeFileName) return;
    await saveActiveFile(markdownText);
  };

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.key.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
    cmd.label.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  if (!activeFileName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
            <Code className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-1">Ninguna nota seleccionada</h3>
          <p className="text-sm text-slate-500">Selecciona un archivo en la barra lateral para ver su contenido o editarlo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden relative">
      {/* Editor Sub-Header */}
      <div className="h-14 border-b border-slate-800/80 px-6 flex justify-between items-center bg-slate-900/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Documento Activo:</span>
          <span className="text-sm font-semibold text-slate-200" id="active-filename">
            {activeFileName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span id="save-indicator" className="text-xs text-slate-500 flex items-center gap-1.5">
            {isSaving ? (
              <span className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
            ) : isModified ? (
              <span className="text-amber-500">● Cambios sin guardar</span>
            ) : (
              <span className="text-slate-500">✔ Guardado</span>
            )}
          </span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 shadow-lg shadow-slate-950/20"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar (Ctrl + S)
          </button>
        </div>
      </div>

      {/* Workspace Dividido (Split editor) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Lado Izquierdo: Editor Markdown Puro */}
        <div className="w-1/2 h-full border-r border-slate-800/50 flex flex-col min-h-0 relative">
          <div className="px-4 py-1.5 bg-slate-900/30 border-b border-slate-800/50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 select-none">
            <Edit3 className="w-3 h-3 text-brand-400" />
            <span>Editor Markdown (.md plano)</span>
          </div>
          <textarea
            ref={textareaRef}
            value={markdownText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
            placeholder="Escribe tu nota aquí usando Markdown puro..."
            className="flex-1 w-full bg-slate-950 text-slate-300 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed border-0 overflow-y-auto focus:ring-0"
          />

          {/* Menú de Slash Commands Flotante */}
          {slashMenu.visible && filteredCommands.length > 0 && (
            <div
              style={{ top: slashMenu.y, left: slashMenu.x }}
              className="absolute bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-xl p-1.5 shadow-2xl z-40 w-60 max-h-56 overflow-y-auto"
            >
              <div className="px-2.5 py-1 text-[9px] font-bold text-brand-400 uppercase tracking-wider border-b border-slate-800/60 mb-1 flex items-center justify-between select-none">
                <span>Comandos Rápidos</span>
                <span className="text-[8px] text-slate-500 font-normal">↑↓ Navegar | Enter</span>
              </div>
              <div className="space-y-0.5">
                {filteredCommands.map((cmd, index) => {
                  const IconComponent = cmd.icon;
                  const isSelected = index === selectedCommandIndex;
                  return (
                    <button
                      key={cmd.key}
                      onClick={() => applyCommand(cmd)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white font-medium shadow-md shadow-brand-600/10'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <span className="text-xs">{cmd.label}</span>
                      </div>
                      <span className={`text-[10px] ${isSelected ? 'text-brand-200' : 'text-slate-500'} font-mono`}>
                        {cmd.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Lado Derecho: Visualización Renderizada HTML */}
        <div className="w-1/2 h-full flex flex-col bg-slate-900/10 min-h-0">
          <div className="px-4 py-1.5 bg-slate-900/30 border-b border-slate-800/50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 select-none">
            <Eye className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Visualización Renderizada</span>
          </div>
          <div
            ref={previewRef}
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(markdownText, imagesMap) }}
            className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
export default TipTapEditor;
