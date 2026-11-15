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
   relitree/escala.py      escala temporal adaptativa: cada tramo recibe espacio según cuántas tradiciones nacen en él
   relitree/trazado.py     trazado automático: carril (x) de cada religión y altura de su línea de vida
   relitree/construir.py   → public/datos/relitree.sqlite + public/datos/iconos/
   relitree/iconos.py      descarga símbolos libres de Wikimedia Commons
   relitree/sembrar.py     siembra inicial desde backend/semilla/religiones.txt
   tests/                  pytest: fichas válidas, escala monótona, trazado sin solapes
src/app/                ← Angular 22 (standalone, signals, sin zone.js)
   datos.ts                carga la SQLite con sql.js (WebAssembly) y la consulta
   estado.ts               selección, filtros, capas, vista
   lienzo.ts               SVG del árbol en dos presentaciones (columnas y radial), zoom, ejes anclados, etiquetas sin solape, exportación SVG
   app.ts / app.html       barra superior, paneles flotantes, panel de detalle
   enciclopedia.ts         lector de la enciclopedia (índice, artículo, lectura en voz alta)
   i18n.ts                 textos de interfaz en es, ca, en, fr, de, pt, it (detección automática)
   glifos.ts               iconos de interfaz y glifos por tipo (dibujo propio)
```

`public/datos/` es un artefacto generado: no se versiona ni se edita a mano.

## Cómo se dibuja el árbol

- **Nodo** = símbolo + nombre + fechas, colocado en el año de inicio. Aro discontinuo = tradición extinguida.
- **Línea de vida**: sube desde el nodo solo hasta donde hace falta: hasta su última rama o, si es un tronco (importancia ≥ 4), hasta su final o el presente. Si sigue más allá de su extinción para alcanzar una rama tardía, ese tramo es punteado. Así un carril aloja muchas tradiciones apiladas.
- **Rama**: línea horizontal (arco en la vista radial) desde la línea del origen hasta el nodo, siempre visible, con degradado si cambia de territorio. Renacimientos: punteada. Segundas fuentes: curva fina continua. Influencias: curva discontinua (las que cruzan territorios solo se muestran al seleccionar).
- **Grosor** por importancia: 1,2 · 2,2 · 5 · 10 · 18 px.
- **Selección**: resalta todo el linaje ascendente, todo el árbol que desciende y las influencias directas.
- **Etiquetas**: en cada nivel de zoom se muestran todas las que caben sin pisarse, por orden de importancia.
- **Vista radial**: la misma geometría en polares (ángulo = posición horizontal, radio = tiempo; lo más antiguo en el centro).
- El trazado coloca las tradiciones en orden cronológico, cada una en el carril libre más cercano a su origen, evitando que una rama pase sobre un símbolo.

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
- Tono neutral y respetuoso con todas las tradiciones, contando tanto sus luces como sus sombras, con hechos.

## Convenciones de interfaz (preferencias de Alejandro)

- Sin títulos sobre el lienzo; minimalismo, mucho aire; nada de cajetines ni filas de divisores.
- Barra superior fija con todos los botones juntos: buscar · filtros y capas · leyenda · enciclopedia (libro abierto) · vista radial/columnas · tema · Acerca de. Sin controles de zoom (rueda, pellizco, teclas + − 0). **Alt + clic en Acerca de** abre Herramientas (exportar SVG, enlaces al editor Atlas, SQLite).
- El editor es un proyecto aparte: https://github.com/AlejandroPico/Editor (web: https://alejandropico.github.io/Editor/). Aquí solo se enlaza.
- Temas día / tarde / noche / automático (según fecha y hora locales).
- Todo vectorial: nada de imágenes de mapa de bits en el árbol.
- `favicon.svg` en la raíz del proyecto (lo lee el portfolio) y copia en `public/`.
- La enciclopedia usa todo el ancho de pantalla y tiene botón de lectura en voz alta.
- Al cerrar cada fase: dar los comandos PowerShell de git y los de ejecución local; mantener `tareas.md` al día quitando lo terminado.
