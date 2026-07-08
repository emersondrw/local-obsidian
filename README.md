# 🏛️ Personal Vault

**Editor de Notas Local — Estilo Obsidian + Notion**

Una aplicación web progresiva que funciona 100% offline, diseñada para escribir, organizar y conectar notas en formato Markdown directamente desde tu navegador. Tus archivos viven en tu disco local, sin servidores ni cuentas.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3dotjs)

---

## ✨ Funcionalidades

- **Editor Dividido**: Markdown plano a la izquierda, visualización renderizada en tiempo real a la derecha
- **WikiLinks `[[Nota]]`**: Navegación bidireccional entre notas con búsqueda tolerante a tildes y mayúsculas
- **Pegado de Imágenes**: `Ctrl + V` para pegar screenshots directamente — se guardan como archivos PNG en tu bóveda
- **Slash Commands `/`**: Menú flotante de atajos (títulos, listas, código, fechas, enlaces)
- **Grafo de Conexiones**: Visualización interactiva en D3.js de cómo se conectan tus notas
- **Persistencia Local**: Tus archivos `.md` viven en tu disco. Sin cloud. Sin cuentas. Sin tracking.
- **Paneles Colapsables**: Sidebar y Grafo se colapsan para darte espacio máximo de escritura

---

## 🚀 Instalación

### Requisitos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **Navegador Chromium** (Chrome, Edge, Brave) — necesario para la File System Access API

### Levantar en local

```bash
git clone https://github.com/emersondrw/local-obsidian.git
cd local-obsidian
npm install
npm run dev
```

Abre **`http://localhost:5173/local-obsidian/`** en tu navegador.

### Build de producción

```bash
npm run build
npm run preview
```

---

## 📦 Deploy

El proyecto incluye un workflow de **GitHub Actions** que despliega automáticamente a **GitHub Pages** en cada push a `main`.

1. En tu repositorio → **Settings → Pages → Source → GitHub Actions**
2. Haz push a `main`
3. Tu app estará en: `https://<usuario>.github.io/local-obsidian/`

---

## 🏗️ Stack Técnico

| Capa | Tecnología |
|---|---|
| UI Framework | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Styling | Tailwind CSS 4 |
| Grafo | D3.js 7 (force simulation) |
| Persistencia | File System Access API + idb-keyval |
| Icons | Lucide React |
| CI/CD | GitHub Actions → GitHub Pages |

---

## 📄 Licencia

MIT
