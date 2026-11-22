# Relitree

**Versión 1.7.45**

La [enciclopedia](enciclopedia/PLAN.md#fase-e03--cristianismo--apóstoles-y-primeros-siglos) amplía los artículos de Patrística e Iglesias e Imperio romano. El lector conserva el historial y la posición de lectura de cada visita y muestra barras de desplazamiento que se ocultan en reposo.

El menú Visualizaciones reúne doce maneras de explorar el catálogo. La vista por territorios abre en trazado compacto. La capa **Puentes** marca los cruces de ramas y líneas de vida en las vistas por territorios y radial. Las marcas temporales mantienen una separación visual regular. El símbolo ≈ identifica los años redondeados.

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
