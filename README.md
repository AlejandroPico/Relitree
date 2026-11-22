# Relitree

**Versión 1.7.52**

La [fase E15](enciclopedia/PLAN.md#fase-e15--cristianismo--tradiciones-29) incorpora las entregas 15.1–15.3. Donatismo, Arrianismo, Priscilianismo, Pelagianismo, Iglesias ortodoxas orientales e Iglesia copta superan las 10.000 palabras de cuerpo por ficha. Los artículos reúnen 21 imágenes acreditadas y se enlazan desde el glosario y los cinco temas comparativos de E01.

La [fase E14](enciclopedia/PLAN.md#fase-e14--cristianismo--tradiciones-19) incorpora Marcionismo, Montanismo, Monacato cristiano, Orden benedictina, Orden cisterciense e Iglesia apostólica armenia. Los artículos incluyen índice de secciones, esquemas y bibliografía. El glosario y los cinco temas comparativos de E01 recogen estas incorporaciones.

El índice de la Enciclopedia muestra en negrita los artículos completos de la revisión iniciada en E14. El nombre de una entrada conserva esa indicación tanto si se abre directamente como si contiene un desplegable.

Las entregas 14.1–14.3 de la enciclopedia amplían las entradas de Cristianismo, Ebionitas, Elcasaítas, Maniqueísmo, Gnosticismo y Valentinianismo. Cada entrada supera las 10.000 palabras y cuenta con un índice de secciones. La entrega incorpora las remisiones correspondientes en el glosario y los cinco temas comparativos de E01.

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
