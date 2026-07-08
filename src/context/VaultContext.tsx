import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';

interface GraphNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface VaultContextType {
  directoryHandle: FileSystemDirectoryHandle | null;
  filesMap: Map<string, FileSystemFileHandle>;
  imagesMap: Map<string, string>;
  activeFileName: string | null;
  activeFileContent: string;
  isModified: boolean;
  isSaving: boolean;
  nodes: GraphNode[];
  links: GraphLink[];
  selectVault: () => Promise<void>;
  closeVault: () => void;
  selectFile: (name: string) => Promise<void>;
  saveActiveFile: (content: string) => Promise<void>;
  createNewFile: (name: string) => Promise<string>;
  deleteFile: (name: string) => Promise<void>;
  scanVault: () => Promise<void>;
  setModified: (val: boolean) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

// Función auxiliar para verificar/solicitar permisos sobre un handle del sistema de archivos
async function verifyPermission(fileHandle: any, readWrite: boolean): Promise<boolean> {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  // Comprobar si ya tenemos permiso
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Solicitar permiso
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [filesMap, setFilesMap] = useState<Map<string, FileSystemFileHandle>>(new Map());
  const [imagesMap, setImagesMap] = useState<Map<string, string>>(new Map());
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [isModified, setIsModified] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  // Función para revocar ObjectURLs anteriores y prevenir fugas de memoria
  const clearImagesMap = useCallback((oldMap: Map<string, string>) => {
    oldMap.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignorar error al liberar memoria
      }
    });
  }, []);

  // Escanear la bóveda para listar archivos y analizar enlaces (Grafo Real)
  const scanVault = useCallback(async (dirHandle = directoryHandle) => {
    if (!dirHandle) return;

    try {
      const newFilesMap = new Map<string, FileSystemFileHandle>();
      const newImagesMap = new Map<string, string>();
      const imageHandles: { name: string; handle: FileSystemFileHandle }[] = [];
      const newNodes: GraphNode[] = [];
      const tempLinks: { source: string; target: string }[] = [];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          if (entry.name.endsWith('.md')) {
            newFilesMap.set(entry.name, entry as FileSystemFileHandle);
            newNodes.push({
              id: entry.name,
              label: entry.name.replace('.md', ''),
            });
          } else if (/\.(png|jpe?g|gif|webp)$/i.test(entry.name)) {
            imageHandles.push({ name: entry.name, handle: entry as FileSystemFileHandle });
          }
        }
      }

      setFilesMap(newFilesMap);

      // Cargar imágenes locales en paralelo y generar ObjectURLs
      const imagePromises = imageHandles.map(async ({ name, handle }) => {
        try {
          const file = await handle.getFile();
          const objectUrl = URL.createObjectURL(file);
          newImagesMap.set(name, objectUrl);
        } catch (e) {
          console.error("Error cargando imagen en memoria: " + name, e);
        }
      });

      // Analizar enlaces bidireccionales en cada archivo en paralelo para construir el grafo real
      const linkPromises = Array.from(newFilesMap.entries()).map(async ([name, handle]) => {
        try {
          const file = await handle.getFile();
          const text = await file.text();
          
          // Expresión regular para WikiLinks: [[Nombre Nota]]
          const wikiLinkRegex = /\[\[(.*?)\]\]/g;
          const matches = [...text.matchAll(wikiLinkRegex)];
          
          matches.forEach(match => {
            const targetLabel = match[1].trim();
            const targetName = `${targetLabel}.md`;
            
            // Solo creamos enlaces hacia notas que existen en la bóveda
            if (newFilesMap.has(targetName)) {
              tempLinks.push({
                source: name,
                target: targetName,
              });
            }
          });
        } catch (e) {
          console.error("Error analizando wikilinks para la nota: " + name, e);
        }
      });

      await Promise.all([...imagePromises, ...linkPromises]);

      // Eliminar enlaces duplicados
      const uniqueLinks = tempLinks.filter(
        (link, index, self) =>
          self.findIndex(
            l =>
              (l.source === link.source && l.target === link.target) ||
              (l.source === link.target && l.target === link.source)
          ) === index
      );

      // Actualizar el mapa de imágenes liberando memoria previa
      setImagesMap(prev => {
        clearImagesMap(prev);
        return newImagesMap;
      });

      setNodes(newNodes);
      setLinks(uniqueLinks);
    } catch (err) {
      console.error("Error escaneando la Bóveda:", err);
    }
  }, [directoryHandle, clearImagesMap]);

  // Restaurar el último directorio en la carga de la aplicación (IndexedDB)
  useEffect(() => {
    async function restoreVault() {
      try {
        const savedHandle = await get<FileSystemDirectoryHandle>('last_vault_handle');
        if (savedHandle) {
          // Solicitar permisos del navegador al usuario
          const permissionGranted = await verifyPermission(savedHandle, true);
          if (permissionGranted) {
            setDirectoryHandle(savedHandle);
            await scanVault(savedHandle);
          } else {
            // Si el permiso es denegado, limpiar
            await del('last_vault_handle');
          }
        }
      } catch (err) {
        console.warn("No se pudo restaurar la bóveda guardada:", err);
      }
    }
    restoreVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seleccionar una bóveda desde el disco
  const selectVault = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDirectoryHandle(handle);
      await set('last_vault_handle', handle);
      await scanVault(handle);
      // Limpiar archivo activo
      setActiveFileName(null);
      setActiveFileContent('');
      setIsModified(false);
    } catch (err) {
      console.error("Error seleccionando directorio:", err);
      if (err instanceof Error && err.name !== 'AbortError') {
        alert(`Error al abrir la carpeta: ${err.message}`);
      }
    }
  };

  // Cerrar la bóveda actual
  const closeVault = async () => {
    setDirectoryHandle(null);
    setFilesMap(new Map());
    setImagesMap(new Map());
    setActiveFileName(null);
    setActiveFileContent('');
    setIsModified(false);
    setNodes([]);
    setLinks([]);
    await del('last_vault_handle');
  };

  // Seleccionar y cargar un archivo
  const selectFile = async (name: string) => {
    const handle = filesMap.get(name);
    if (!handle) return;

    if (isModified) {
      const confirmLeave = window.confirm("Tienes cambios sin guardar. ¿Deseas salir de todas formas?");
      if (!confirmLeave) return;
    }

    try {
      const file = await handle.getFile();
      const text = await file.text();
      setActiveFileName(name);
      setActiveFileContent(text);
      setIsModified(false);
    } catch (err) {
      console.error("Error leyendo archivo:", err);
      alert(`No se pudo leer el archivo: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Guardar archivo activo
  const saveActiveFile = async (content: string) => {
    if (!activeFileName || !directoryHandle) return;
    const handle = filesMap.get(activeFileName);
    if (!handle) return;

    setIsSaving(true);
    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      
      setActiveFileContent(content);
      setIsModified(false);
      
      // Volver a escanear en segundo plano para actualizar el grafo ante posibles wikilinks agregados
      await scanVault();
    } catch (err) {
      console.error("Error guardando el archivo:", err);
      alert(`Error al guardar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Crear una nueva nota
  const createNewFile = async (name: string): Promise<string> => {
    if (!directoryHandle) throw new Error("Bóveda no seleccionada");
    
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    
    try {
      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Estructura inicial con YAML Frontmatter
      const cleanName = fileName.replace('.md', '');
      const initialContent = `---\ntitle: ${cleanName}\ndate: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${cleanName}\n\nEscribe aquí tu contenido...`;
      
      await writable.write(initialContent);
      await writable.close();

      // Escanear para refrescar la barra lateral
      await scanVault();
      
      return fileName;
    } catch (err) {
      console.error("Error al crear el archivo:", err);
      throw err;
    }
  };

  // Eliminar un archivo
  const deleteFile = async (name: string) => {
    if (!directoryHandle) return;

    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar la nota "${name.replace('.md', '')}"?`);
    if (!confirmDelete) return;

    try {
      await directoryHandle.removeEntry(name);
      if (activeFileName === name) {
        setActiveFileName(null);
        setActiveFileContent('');
        setIsModified(false);
      }
      await scanVault();
    } catch (err) {
      console.error("Error eliminando archivo:", err);
      alert(`Error al eliminar archivo: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const setModified = useCallback((val: boolean) => {
    setIsModified(val);
  }, []);

  return (
    <VaultContext.Provider
      value={{
        directoryHandle,
        filesMap,
        imagesMap,
        activeFileName,
        activeFileContent,
        isModified,
        isSaving,
        nodes,
        links,
        selectVault,
        closeVault,
        selectFile,
        saveActiveFile,
        createNewFile,
        deleteFile,
        scanVault,
        setModified,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault debe ser usado dentro de un VaultProvider');
  }
  return context;
};
