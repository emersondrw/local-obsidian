import React from 'react';
import { BookOpen, FolderGit, LogOut, HelpCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const Header: React.FC = () => {
  const { directoryHandle, selectVault, closeVault, selectFile, scanVault } = useVault();

  const showSyntaxGuide = async () => {
    if (!directoryHandle) return;

    const guideName = 'Guia de Sintaxis.md';
    const guideContent = `# Guía de Sintaxis Interactiva - Emer's Second Brain

¡Bienvenido a tu segundo cerebro! Esta nota sirve como guía de referencia y ejemplo interactivo de todas las características de formato de Markdown avanzadas y estilos tipo Obsidian soportados nativamente en esta aplicación.

---

## 1. Cabeceras (Headers)
Usa el carácter \`#\` al inicio de una línea seguido de un espacio para crear encabezados de diferentes niveles:

# Título 1 (Grande)
## Título 2 (Mediano)
### Título 3 (Pequeño)

---

## 2. Formato de Texto
Aplica estilos sencillos al texto con marcadores estándar y extendidos:

*   **Texto en Negrita:** Envuelve el texto en doble asterisco: **texto en negrita**.
*   **Texto Resaltado (Highlight):** Envuelve el texto en doble signo igual: ==texto resaltado==. Ideal para destacar ideas importantes de noche sin molestar a la vista.
*   **Texto Tachado (Strikethrough):** Envuelve el texto en doble tilde: ~~texto tachado~~.

---

## 3. Listas y Tareas
Organiza tus notas con listas de viñetas, numeradas o tareas interactivas:

*   **Lista de viñetas:**
    - Elemento de lista 1
    - Elemento de lista con sangría
*   **Lista de Tareas:**
    - [ ] Tarea pendiente
    - [x] Tarea completada (se muestra tachada y con opacidad reducida)

---

## 4. Citas y Bloques de Texto
Las citas se adaptan visualmente al tema oscuro minimalista con bordes de color bronce cálido:

> Esta es una cita en bloque estándar de una sola línea.

> >> Esta es una cita en bloque anidada o destacada con mayor énfasis.
> Puedes añadir múltiples párrafos consecutivos dentro de la misma cita dejando el carácter \`>\` al inicio de cada línea.

---

## 5. Destacados (Obsidian Callouts)
Los callouts te permiten crear paneles visuales categorizados con colores y emojis de forma nativa. La sintaxis es \`> [!tipo] Opcional: Título\`:

> [!info] Información Importante
> Esta es una nota informativa general. Utiliza un fondo azul oscuro y un icono representativo para llamar tu atención de manera suave.

> [!tip] Consejo Útil
> ¡Este es un consejo! Utiliza el color de acento bronce cálido del tema para destacar ideas clave o atajos.

> [!warning] Advertencia Nocturna
> Ten cuidado al trabajar con pantallas muy brillantes de noche. Este panel de color naranja te recuerda cuidar tus ojos.

> [!danger] Peligro o Error
> Este panel resalta en rojo fallos críticos, errores o advertencias de seguridad urgentes.

> [!success] Éxito o Completado
> ¡Operación completada con éxito! Representado en color verde salvia.

### Callouts Colapsables (Details/Summary nativos)
Puedes hacer que un callout sea colapsable añadiendo un \`-\` (colapsado por defecto) o un \`+\` (expandido por defecto) al final del tipo:

> [!faq]- ¿Cómo funciona la base de datos offline?
> Funciona de forma 100% local en tu navegador utilizando la API **File System Access** y guardando los permisos de forma segura en **IndexedDB**. Tus datos nunca salen de tu ordenador.

---

## 6. Enlaces Bidireccionales (WikiLinks)
Conecta tus notas como en Obsidian escribiendo el nombre de otra nota entre corchetes dobles:
*   Enlace a nota existente: [[Bienvenida]]
*   Enlace a nota nueva: [[Mi Nueva Nota]] (si haces clic en la previsualización, te preguntará si deseas crear el archivo automáticamente).

---

## 7. Bloques de Código
Inserta fragmentos de código con formato monoespaciado envolviendo el bloque con tres acentos graves:

\`\`\`javascript
// Ejemplo de código con tipografía optimizada para lectura
function brainSync() {
  const thoughts = ["Obsidian", "Markdown", "Local"];
  console.log("Sincronizando Segundo Cerebro...");
}
\`\`\`

---

## 8. Etiquetas (Tags)
Agrega etiquetas de forma directa anteponiendo \`#\` a una palabra alfanumérica sin espacios. Se renderizarán automáticamente como badges interactivos:
#segundo-cerebro #sintaxis/markdown #productividad #obsidian-local
`;

    try {
      // Crear o abrir el archivo 'Guia de Sintaxis.md' directamente
      const fileHandle = await directoryHandle.getFileHandle(guideName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(guideContent);
      await writable.close();

      // Escanear la bóveda para reflejar los cambios y seleccionar el archivo
      await scanVault();
      await selectFile(guideName);
    } catch (error) {
      console.error("Error al abrir o crear la guía de sintaxis:", error);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md py-4 px-6 flex justify-between items-center z-10 shrink-0 h-16">
      {/* Brand Logo & Syntax Guide Button */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-600/10">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Emer's Second Brain
            </h1>
            <p className="text-[10px] text-slate-500">Editor de Notas Local 100% Offline</p>
          </div>
        </div>

        {directoryHandle && (
          <button
            onClick={showSyntaxGuide}
            className="flex items-center gap-1.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 hover:border-brand-500/40 text-brand-300 hover:text-brand-200 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm shadow-brand-950/20"
            title="Ver Guía de Sintaxis de Obsidian"
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
            Guía de Sintaxis
          </button>
        )}
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
              className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 active:scale-95 transition-all text-white font-semibold py-1.5 px-3.5 rounded-lg shadow-md shadow-brand-600/15 text-xs"
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
