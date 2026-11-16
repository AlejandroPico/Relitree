# Relitree · guía para agentes y colaboradores

Relitree es **el árbol de las religiones**: un mapa interactivo y vectorial de las tradiciones espirituales de la humanidad. Eje vertical = tiempo (presente arriba, escala no lineal); eje horizontal = once territorios. Cada tradición es una línea de vida; las ramas indican de dónde procede. Publicado en GitHub Pages mediante GitHub Actions.

## Arquitectura

```
religiones/<id>/        ← datos estructurales. Una carpeta por religión
   ficha.json              región, fechas, tipo, importancia, padres, influencias, fieles, icono
   icono.svg               símbolo propio (opcional)
i18n/<idioma>/          ← TODOS los textos traducibles, centralizados
   interfaz.json           textos de la interfaz (clave → texto)
   catalogo.json           nombres de territorios y tipos
   religiones.json         por id: nombre, alias y resumen
enciclopedia/<idioma>/  ← artículos largos en Markdown
   temas/NN-slug.md        temas generales (id "tema:slug"): solo cómo leer el árbol, tipos, glosarios…
   religiones/<id>.md      artículo principal de cada religión
   religiones/<id>/<slug>.md   subartículos de desarrollo (id "<id>/<slug>"): concilios, cruzadas…
backend/                ← Python: valida, calcula el trazado y genera SQLite
   relitree/modelo.py      regiones, tipos, carga y validación; herencia de símbolos por tronco
   relitree/escala.py      escala temporal adaptativa
   relitree/trazado.py     trazado automático: carril (x) de cada religión y altura de su línea de vida
   relitree/construir.py   → public/datos/relitree.sqlite + public/datos/iconos/
   relitree/iconos.py      descarga símbolos libres de Wikimedia Commons
   relitree/sembrar.py     alta de tradiciones nuevas desde backend/semilla/religiones.txt
   tests/                  pytest
src/app/                ← Angular 22 (standalone, signals, sin zone.js). Sin textos en el código.
   datos.ts · estado.ts · lienzo.ts · app.ts/app.html · enciclopedia.ts · i18n.ts · glifos.ts
favicon.svg             ← icono del proyecto en la RAÍZ (lo leen el portfolio y otras herramientas); copia en public/
```

## Traducción

El idioma base es `es`. Para traducir: copiar `i18n/es/` a `i18n/<idioma>/` y `enciclopedia/es/` a `enciclopedia/<idioma>/`, y traducir los valores (nunca las claves ni los ids, ni los `[[enlaces]]`). No hace falta que una traducción esté completa: lo que falte se muestra en español. La interfaz ya está en es, ca, en, fr, de, pt, it; el contenido (catálogo, religiones, enciclopedia), solo en es.

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
| `region` | `afr eur opr asn asm aso sea oce nam mes sam`. |
| `inicio`, `fin` | Años; negativos = a. C.; `fin: null` = sigue viva. |
| `tipo` | Clave de `modelo.TIPOS`. |
| `importancia` | 1–5. Grosor de línea, tamaño del nodo y prioridad de su etiqueta. |
| `padres` | `[{id, relacion}]`. El primero es el origen principal. `relacion`: derivacion, cisma, reforma, sincretismo, renacimiento. |
| `influencias` | Ids de tradiciones que influyeron sin ser origen. |
| `fieles`, `fieles_fuente` | Estimación actual de fieles y su fuente. Solo en tradiciones vivas. Hay que verificar cada cifra con fuente antes de darla por buena. |
| `icono` | `null` o `{archivo, fuente, licencia, autor}` (lo rellena `iconos.py`). |

Nombre, alias y resumen NO van en la ficha: van en `i18n/es/religiones.json`.

**Símbolos heredados:** una rama sin `icono.svg` muestra el símbolo de su tronco (`modelo.FAMILIAS_ICONO`: cristianismo, islam, budismo, hinduismo…), salvo sincretismos, neopaganismos, filosofías y nuevos movimientos. El resto usa el glifo de su tipo.

**Alta de tradiciones:** añadir líneas a `backend/semilla/religiones.txt` y ejecutar `python -m relitree.sembrar` (solo crea las que no existen), o crear a mano la carpeta, la entrada de i18n y el artículo.

## Enciclopedia (estándar exigido)

Trabajo de fondo pendiente, pensado para sesiones dedicadas. Lo que hay ahora son resúmenes y un esqueleto cronológico de Cristianismo.

- Cada artículo principal es una **historia completa y extensa** de la tradición, ordenada cronológicamente (edad antigua, media, moderna, contemporánea): cómo nació, por qué, cómo evolucionó, sus figuras principales, sus cismas y derivaciones, su relación con el poder, sus doctrinas y prácticas en cada época. Nivel universitario; nada de resúmenes. Nada de apartados genéricos del tipo «luces» y «sombras»: los hechos, buenos y malos, se cuentan en su momento histórico.
- Todo episodio importante (cada concilio, cada cruzada, cada cisma, cada orden, cada figura mayor) tiene su **subartículo** propio en `religiones/<id>/<slug>.md`, enlazado desde el principal.
- Los concilios, cruzadas, etc. pertenecen a su religión, no a «temas generales».
- Referencia de estilo y extensión: la enciclopedia del proyecto Historicmap.
- Enlaces internos: `[[id]]`, `[[id|texto]]`, `[[id/slug|texto]]`. Primera línea `# Título`.

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
- `favicon.svg` en la raíz del proyecto (obligatorio) y copia en `public/`.
- Panel de detalle: cabecera fija (símbolo, nombre, fechas, cerrar) y cuerpo desplazable sin barra de scroll visible.
- Índice de la enciclopedia conmutable: alfabético total o por territorios desplegables.
- La enciclopedia usa todo el ancho de pantalla y tiene botón de lectura en voz alta.
- Al cerrar cada fase: dar los comandos PowerShell de git y los de ejecución local; mantener `tareas.md` al día quitando lo terminado.
