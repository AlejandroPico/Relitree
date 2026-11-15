# Relitree · guía para agentes y colaboradores

Relitree es **el árbol de las religiones**: un mapa interactivo y vectorial de las tradiciones espirituales de la humanidad. Eje vertical = tiempo (presente arriba, escala no lineal); eje horizontal = once territorios. Cada tradición es una línea de vida; las ramas indican de dónde procede. Publicado en GitHub Pages mediante GitHub Actions.

## Arquitectura

```
religiones/<id>/        ← FUENTE CANÓNICA. Una carpeta por religión
   ficha.json              datos estructurados
   articulo.md             artículo de la enciclopedia (Markdown)
   icono.svg               símbolo (opcional; si falta se usa el glifo del tipo)
enciclopedia/temas/     ← artículos generales (NN-slug.md → id "tema:slug")
backend/                ← Python: valida, calcula el trazado y genera SQLite
   relitree/modelo.py      regiones, tipos, carga y validación de fichas
   relitree/escala.py      escala temporal por tramos (px por año) y marcas del eje
   relitree/trazado.py     asignación automática de carriles (x) por región
   relitree/construir.py   → public/datos/relitree.sqlite + public/datos/iconos/
   relitree/iconos.py      descarga símbolos libres de Wikimedia Commons
   relitree/sembrar.py     siembra inicial desde backend/semilla/religiones.txt
   tests/                  pytest: fichas válidas, escala monótona, trazado sin solapes
src/app/                ← Angular 22 (standalone, signals, sin zone.js)
   datos.ts                carga la SQLite con sql.js (WebAssembly) y la consulta
   estado.ts               selección, filtros, capas, vista
   lienzo.ts               SVG del árbol, zoom/desplazamiento, ejes anclados, exportación SVG
   app.ts / app.html       barra superior, paneles flotantes, panel de detalle
   enciclopedia.ts         lector de la enciclopedia (índice, artículo, lectura en voz alta)
   i18n.ts                 textos de interfaz en es, ca, en, fr, de, pt, it (detección automática)
   glifos.ts               iconos de interfaz y glifos por tipo (dibujo propio)
public/editor/          ← Atlas Studio, el editor autónomo anterior (se conserva tal cual)
```

`public/datos/` es un artefacto generado: no se versiona ni se edita a mano.

## Flujo de trabajo

1. Editar o crear carpetas en `religiones/` (y artículos en `enciclopedia/temas/`).
2. `npm test` → valida fichas y trazado.
3. `npm start` → regenera la SQLite y arranca Angular en local (`npm run build` para producción).
4. El push a `main` lo hace siempre Alejandro; Actions prueba, compila y publica.

## ficha.json

| Campo | Significado |
|---|---|
| `id` | Igual que el nombre de la carpeta (minúsculas, guiones). |
| `nombre`, `alias` | Nombre visible y otras denominaciones (se usan en la búsqueda). |
| `region` | `afr eur opr asn asm aso sea oce nam mes sam` (ver `modelo.REGIONES`). |
| `inicio`, `fin` | Años; negativos = a. C.; `fin: null` = sigue viva. |
| `tipo` | Clave de `modelo.TIPOS` (ani, cha, pol, mon, dua, nte, sin…). |
| `importancia` | 1–5. Determina grosor de línea, tamaño del nodo y nivel de zoom en que aparece. |
| `padres` | `[{id, relacion}]`. El primero es el origen principal (decide el trazado). `relacion`: derivacion, cisma, reforma, sincretismo, renacimiento. |
| `influencias` | Ids de tradiciones que influyeron sin ser origen (línea discontinua). |
| `resumen` | Una o dos frases para el panel lateral. |
| `icono` | `null` o `{archivo, fuente, licencia, autor}` (lo rellena `iconos.py`). |

Reglas que comprueba la validación: el padre debe existir y ser anterior; sin ciclos; región y tipo conocidos.

## articulo.md

Primera línea `# Título` (se ignora al renderizar). Markdown normal con tablas. Enlaces internos: `[[id]]` o `[[id|texto]]` a otra religión, `[[slug]]` a un tema. Estructura recomendada para artículos amplios: Orígenes · Creencias · Textos · Ritos y prácticas · Organización y ramas · Deidades o figuras · Curiosidades · Para saber más.

## Criterios editoriales (obligatorios)

- **Contenido propio.** Selección, fechas, relaciones y textos se redactan a partir de fuentes académicas y enciclopédicas contrastadas (Wikipedia, Britannica, bibliografía especializada). No se transcriben ni calcan infografías, mapas o textos de terceros.
- **Iconos:** solo símbolos de dominio público o licencia libre (Wikimedia Commons), con la licencia anotada en la ficha; nunca logotipos registrados de organizaciones. Si no hay símbolo libre, se usa el glifo del tipo.
- Las fechas antiguas son aproximadas; en prehistoria se representan evidencias arqueológicas, no doctrinas.
- Una rama es una decisión editorial: cuando el origen es discutido, se elige el consenso mayoritario y se explica en el artículo.
- Tono neutral y respetuoso con todas las tradiciones.

## Convenciones de interfaz (preferencias de Alejandro)

- Sin títulos sobre el lienzo; minimalismo, mucho aire; nada de cajetines ni filas de divisores.
- Barra superior: buscar · filtros y capas · leyenda · enciclopedia (libro abierto) · zoom · tema · Acerca de. **Alt + clic en Acerca de** abre Herramientas (exportar SVG, editor, SQLite).
- Temas día / tarde / noche / automático (según fecha y hora locales).
- Todo vectorial: nada de imágenes de mapa de bits en el árbol.
- `favicon.svg` en la raíz del proyecto (lo lee el portfolio) y copia en `public/`.
- La enciclopedia usa todo el ancho de pantalla y tiene botón de lectura en voz alta.
- Al cerrar cada fase: dar los comandos PowerShell de git y los de ejecución local; mantener `tareas.md` al día quitando lo terminado.
