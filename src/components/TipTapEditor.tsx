import React, { useEffect, useState, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { Heading1, Heading2, Heading3, CheckSquare, Bold, Link as LinkIcon, Calendar, Code, Save, Eye, Edit3, Quote, Columns } from 'lucide-react';

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
  html = html.replace(/<\/ul>\s*<ul class="list-disc pl-5 mb-3">/g, '');

  // Resaltado de Obsidian ==texto==
  html = html.replace(/==(.*?)==/g, '<mark class="bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded font-medium">$1</mark>');

  // Tachado de Markdown ~~texto~~
  html = html.replace(/~~(.*?)~~/g, '<del class="opacity-60 line-through">$1</del>');

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

  // Tags (#tag-name) estilo Obsidian
  html = html.replace(/\B#([a-zA-Z0-9_\-\/]+)\b/g, '<span class="inline-flex items-center bg-slate-900 border border-slate-800/60 text-brand-300 text-[10px] font-semibold px-2 py-0.5 rounded-full select-none hover:text-brand-200 transition-colors cursor-pointer">#$1</span>');

  // Procesador estructurado de líneas para Citas (blockquotes) y Callouts (Destacados)
  const lines = html.split('\n');
  const result: string[] = [];
  let inBlockquote = false;
  let inCallout = false;
  let isCollapsibleCallout = false;
  
  const blockTags = ['<h1>', '<h2>', '<h3>', '<ul', '<ol', '<pre', '<p', '<div', '<blockquote>', '</blockquote>', '<details>', '</details>', '<summary>', '</summary>'];

  // Helper para mapear iconos y colores de callouts de Obsidian
  const getCalloutStyles = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
      case 'note':
      case 'info':
        return { emoji: 'ℹ️', borderClass: 'border-sky-500/80 bg-sky-950/15', textClass: 'text-sky-400' };
      case 'todo':
        return { emoji: '☑️', borderClass: 'border-indigo-500/80 bg-indigo-950/15', textClass: 'text-indigo-400' };
      case 'tip':
      case 'hint':
      case 'important':
        return { emoji: '💡', borderClass: 'border-brand-500/80 bg-brand-950/15', textClass: 'text-brand-300' };
      case 'success':
      case 'check':
      case 'done':
        return { emoji: '✅', borderClass: 'border-emerald-500/80 bg-emerald-950/15', textClass: 'text-emerald-400' };
      case 'question':
      case 'help':
      case 'faq':
        return { emoji: '❓', borderClass: 'border-cyan-500/80 bg-cyan-950/15', textClass: 'text-cyan-400' };
      case 'warning':
      case 'caution':
      case 'attention':
        return { emoji: '⚠️', borderClass: 'border-amber-600/80 bg-amber-950/15', textClass: 'text-amber-400' };
      case 'failure':
      case 'fail':
      case 'missing':
        return { emoji: '❌', borderClass: 'border-rose-500/80 bg-rose-950/15', textClass: 'text-rose-400' };
      case 'danger':
      case 'error':
        return { emoji: '🚨', borderClass: 'border-red-500/80 bg-red-950/15', textClass: 'text-red-400' };
      case 'bug':
        return { emoji: '🐛', borderClass: 'border-red-400/80 bg-red-950/10', textClass: 'text-red-400' };
      case 'example':
        return { emoji: '🧪', borderClass: 'border-slate-500/80 bg-slate-950/15', textClass: 'text-slate-400' };
      case 'quote':
      case 'cite':
        return { emoji: '💬', borderClass: 'border-slate-600/80 bg-slate-900/20', textClass: 'text-slate-400' };
      default:
        return { emoji: 'ℹ️', borderClass: 'border-brand-500/80 bg-brand-950/15', textClass: 'text-brand-300' };
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Las citas y callouts empiezan con &gt; en el texto escapado
    const quoteMatch = line.match(/^\s*&gt;\s?(.*)$/);
    
    if (quoteMatch) {
      const content = quoteMatch[1];
      
      // Verificamos si es el inicio de un callout: [!tipo] o [!tipo-] o [!tipo+]
      const calloutMatch = content.match(/^\[!(.*?)\]\s?(.*)$/);
      
      if (calloutMatch) {
        // Cerrar bloques anteriores
        if (inCallout) {
          result.push(isCollapsibleCallout ? '</div></details>' : '</div></div>');
          inCallout = false;
        }
        if (inBlockquote) {
          result.push('</blockquote>');
          inBlockquote = false;
        }
        
        let typeRaw = calloutMatch[1];
        const titleText = calloutMatch[2];
        
        let collapsibleState: 'none' | 'expanded' | 'collapsed' = 'none';
        if (typeRaw.endsWith('-')) {
          collapsibleState = 'collapsed';
          typeRaw = typeRaw.slice(0, -1);
        } else if (typeRaw.endsWith('+')) {
          collapsibleState = 'expanded';
          typeRaw = typeRaw.slice(0, -1);
        }
        
        const styles = getCalloutStyles(typeRaw);
        const title = titleText ? titleText.trim() : (typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1));
        
        inCallout = true;
        isCollapsibleCallout = collapsibleState !== 'none';
        
        if (isCollapsibleCallout) {
          const isOpen = collapsibleState === 'expanded' ? 'open' : '';
          result.push(`<details ${isOpen} class="callout border-l-4 ${styles.borderClass} p-4 my-4 rounded-r-xl select-text transition-all duration-200">
            <summary class="callout-title font-bold flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden ${styles.textClass}">
              <span>${styles.emoji}</span>
              <span class="flex-1">${title}</span>
            </summary>
            <div class="callout-content mt-2 text-sm text-slate-300 leading-relaxed">`);
        } else {
          result.push(`<div class="callout border-l-4 ${styles.borderClass} p-4 my-4 rounded-r-xl select-text">
            <div class="callout-title font-bold flex items-center gap-2 mb-2 ${styles.textClass}">
              <span>${styles.emoji}</span>
              <span>${title}</span>
            </div>
            <div class="callout-content text-sm text-slate-300 leading-relaxed">`);
        }
      } else {
        // Es contenido interno
        if (inCallout) {
          const trimmed = content.trim();
          if (trimmed) {
            const isBlock = blockTags.some(tag => trimmed.startsWith(tag));
            if (isBlock) {
              result.push(content);
            } else {
              result.push(`<p class="mb-2 leading-relaxed">${content}</p>`);
            }
          } else {
            result.push('<div class="h-2"></div>');
          }
        } else {
          // Cita común (blockquote)
          if (!inBlockquote) {
            inBlockquote = true;
            result.push('<blockquote class="border-l-4 border-brand-500 bg-slate-900/40 px-4 py-2 my-4 rounded-r-md text-slate-400 italic">');
          }
          const trimmed = content.trim();
          if (trimmed) {
            result.push(`<p class="mb-1 leading-relaxed">${content}</p>`);
          }
        }
      }
    } else {
      // Línea no-cita: cerrar bloques abiertos
      if (inCallout) {
        result.push(isCollapsibleCallout ? '</div></details>' : '</div></div>');
        inCallout = false;
      }
      if (inBlockquote) {
        result.push('</blockquote>');
        inBlockquote = false;
      }
      
      const trimmed = line.trim();
      if (!trimmed) {
        result.push('');
      } else {
        const isBlock = blockTags.some(tag => trimmed.startsWith(tag));
        if (isBlock) {
          result.push(line);
        } else {
          result.push(`<p class="mb-3 text-slate-300 text-sm leading-relaxed">${line}</p>`);
        }
      }
    }
  }
  
  // Cerrar bloques remanentes al final del documento
  if (inCallout) {
    result.push(isCollapsibleCallout ? '</div></details>' : '</div></div>');
  }
  if (inBlockquote) {
    result.push('</blockquote>');
  }
  
  return result.join('\n');
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
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
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
    { key: 'code', label: 'Bloque de Código', snippet: '```\n\n```', desc: '``` código ```', icon: Code },
    { key: 'quote', label: 'Cita en Bloque', snippet: '> ', desc: '> cita', icon: Quote }
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
      // Tab para indentar y Shift + Tab para desindentar
      if (e.key === 'Tab') {
        e.preventDefault();
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        // Si es Shift + Tab (Desindentación)
        if (e.shiftKey) {
          const beforeSelection = value.substring(0, start);
          const lineStart = beforeSelection.lastIndexOf('\n') + 1;
          const afterSelection = value.substring(end);

          if (start !== end) {
            // Selección multilinea
            const selectionStartLineIndex = value.substring(0, start).lastIndexOf('\n') + 1;
            const fullSelectionText = value.substring(selectionStartLineIndex, end);
            const lines = fullSelectionText.split('\n');

            const modifiedLines = lines.map(line => {
              if (line.startsWith('\t')) {
                return line.substring(1);
              }
              if (line.startsWith('    ')) {
                return line.substring(4);
              }
              const matchSpaces = line.match(/^ +/);
              if (matchSpaces) {
                const spaceCount = Math.min(matchSpaces[0].length, 4);
                return line.substring(spaceCount);
              }
              return line;
            });

            const newMiddle = modifiedLines.join('\n');
            const newText = value.substring(0, selectionStartLineIndex) + newMiddle + afterSelection;
            setMarkdownText(newText);
            setModified(true);

            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(selectionStartLineIndex, selectionStartLineIndex + newMiddle.length);
            }, 0);
          } else {
            // Línea individual desindentación
            const currentLine = value.substring(lineStart, start);
            let indentLength = 0;
            let newlineText = currentLine;

            if (currentLine.startsWith('\t')) {
              newlineText = currentLine.substring(1);
              indentLength = 1;
            } else if (currentLine.startsWith('    ')) {
              newlineText = currentLine.substring(4);
              indentLength = 4;
            } else {
              const matchSpaces = currentLine.match(/^ +/);
              if (matchSpaces) {
                const spaceCount = Math.min(matchSpaces[0].length, 4);
                newlineText = currentLine.substring(spaceCount);
                indentLength = spaceCount;
              }
            }

            if (indentLength > 0) {
              const newText = value.substring(0, lineStart) + newlineText + value.substring(start);
              setMarkdownText(newText);
              setModified(true);
              setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start - indentLength, start - indentLength);
              }, 0);
            }
          }
        } else {
          // Indentación normal (Tab)
          if (start !== end) {
            // Selección multilinea
            const selectionStartLineIndex = value.substring(0, start).lastIndexOf('\n') + 1;
            const fullSelectionText = value.substring(selectionStartLineIndex, end);
            const lines = fullSelectionText.split('\n');

            const modifiedLines = lines.map(line => '    ' + line);
            const newMiddle = modifiedLines.join('\n');
            const newText = value.substring(0, selectionStartLineIndex) + newMiddle + value.substring(end);
            
            setMarkdownText(newText);
            setModified(true);

            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(selectionStartLineIndex, selectionStartLineIndex + newMiddle.length);
            }, 0);
          } else {
            // Línea única (insertar 4 espacios)
            const before = value.substring(0, start);
            const after = value.substring(end);
            const newText = before + '    ' + after;

            setMarkdownText(newText);
            setModified(true);

            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + 4, start + 4);
            }, 0);
          }
        }
      }

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
          {/* Botones de Control de Vista */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg shrink-0 select-none">
            <button
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded-md transition-all active:scale-95 ${
                viewMode === 'editor'
                  ? 'bg-slate-900 text-brand-400 font-semibold border border-slate-850 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Solo Editor (Ocultar Previsualización)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md transition-all active:scale-95 ${
                viewMode === 'split'
                  ? 'bg-slate-900 text-brand-400 font-semibold border border-slate-850 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Vista Dividida"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-md transition-all active:scale-95 ${
                viewMode === 'preview'
                  ? 'bg-slate-900 text-brand-400 font-semibold border border-slate-850 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Solo Previsualización (Ocultar Editor Markdown)"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-5 w-[1px] bg-slate-800/80 shrink-0"></div>

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
        <div className={`${viewMode === 'preview' ? 'hidden' : viewMode === 'editor' ? 'w-full' : 'w-1/2 border-r border-slate-800/50'} h-full flex flex-col min-h-0 relative`}>
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
        <div className={`${viewMode === 'editor' ? 'hidden' : viewMode === 'preview' ? 'w-full' : 'w-1/2'} h-full flex flex-col bg-slate-900/10 min-h-0`}>
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
