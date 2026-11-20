# Relitree

**Versión 1.7.30**

La [enciclopedia](enciclopedia/PLAN.md#fase-e08--cristianismo--reforma-y-guerras-de-religión) completa «Reforma y guerras de religión» con doce artículos, desde la Reforma protestante y católica hasta las guerras europeas, las paces de Augsburgo y Westfalia y la emigración puritana a Nueva Inglaterra. El botón **Aa** permite ajustar la letra, el interlineado, el espacio entre párrafos y el ancho de lectura.

El menú Visualizaciones reúne doce maneras de explorar el catálogo. La vista por territorios abre en trazado compacto.

El árbol de las religiones: un mapa interactivo y completamente vectorial de las tradiciones espirituales de la humanidad, desde los primeros ritos de la prehistoria hasta hoy. El tiempo corre en vertical y los territorios en horizontal; cada tradición es una línea de vida y cada rama muestra de dónde procede.

- **Front:** Angular 22 (componentes standalone, signals, sin zone.js), SVG con zoom ilimitado.
- **Back de datos:** Python 3.13 valida las fichas, calcula el trazado del árbol y genera una base SQLite que el navegador consulta con WebAssembly.
- **Contenido:** una carpeta por religión en `religiones/`, con ficha, artículo e icono.

## Uso en local

```powershell
pip install -r backend/requirements.txt
npm install
npm start
```

`npm test` ejecuta las pruebas de datos; `npm run build` genera `dist/relitree/browser`.

## Documentación

- [`agentes.md`](agentes.md): arquitectura, modelo de datos y criterios editoriales.
- [`tareas.md`](tareas.md): trabajo pendiente.

Los símbolos proceden de Wikimedia Commons bajo dominio público o licencias libres; la atribución de cada uno figura en su ficha y en la enciclopedia.
