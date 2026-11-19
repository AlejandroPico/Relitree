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
   relitree/simbolos.py    biblioteca de símbolos propios (motivos vectoriales originales) y su asignación
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
- **Línea de vida**: tramo continuo desde el inicio hasta el fin de la ficha o la marca «Hoy» si la tradición sigue vigente. Solo se prolonga en punteado para conectar una rama que surge después de la extinción.
- **Rama**: sale de la línea de vida del origen y llega al nodo hijo. Las conexiones pueden ser horizontales o curvarse hacia el presente para evitar que coincidan. Conservan el degradado cuando cambian de territorio. Las segundas fuentes van en curva fina continua y las influencias en curva discontinua. Las influencias entre territorios se muestran al seleccionar.
- **Grosor**: escala logarítmica a partir de la estimación de fieles. Si falta una cifra se usa el grosor fino de referencia.
- **Selección**: resalta todo el linaje ascendente, todo el árbol que desciende y las influencias directas.
- **Etiquetas**: en cada nivel de zoom se muestran todas las que caben sin pisarse, por orden de importancia.
- **Vista radial**: la misma geometría en polares (ángulo = posición horizontal, radio = tiempo; lo más antiguo en el centro).
- La capa «Todas las líneas vigentes hasta hoy» arranca desactivada. El trazado completo asigna un carril exclusivo por tradición. El plano compacto permite compartir carriles en intervalos separados y dibuja las líneas de menor importancia solo hasta su última rama. SQLite incluye las coordenadas de ambos planos. El selector actualiza la geometría de las vistas por territorios y radial, el eje de territorios y el exportador SVG. En el plano completo los orígenes más antiguos se colocan primero y sus ramas reciben los carriles libres más cercanos por orden cronológico. Las marcas del tramo más antiguo tienen separación visual uniforme.

## Flujo de trabajo

1. Editar o crear carpetas en `religiones/` (y artículos en `enciclopedia/temas/`).
2. `npm test` → valida fichas y trazado.
3. `npm start` → regenera la SQLite y arranca Angular en local (`npm run build` para producción).
4. Trabajar en `main`. Con autorización de Alejandro, publicar directamente en `main`. Las ramas secundarias requieren una indicación expresa. Actions prueba, compila y publica.

## ficha.json

| Campo | Significado |
|---|---|
| `id` | Igual que el nombre de la carpeta (minúsculas, guiones). |
| `region` | `afr eur opr asn asm aso sea oce nam mes sam`. |
| `inicio`, `fin` | Años; negativos = a. C.; `fin: null` = sigue viva. |
| `tipo` | Clave de `modelo.TIPOS`. |
| `importancia` | 1–5. Tamaño del nodo y prioridad de su etiqueta. |
| `padres` | `[{id, relacion}]`. El primero es el origen principal. `relacion`: derivacion, cisma, reforma, sincretismo, renacimiento. |
| `influencias` | Ids de tradiciones que influyeron sin ser origen. |
| `fieles`, `fieles_max`, `fieles_fuente` | Fieles actuales (mínimo y, si las fuentes dan un rango, máximo) y su fuente. Solo en tradiciones vivas. **Nunca una cifra sin fuente**: la validación lo rechaza. |
| `icono` | `null` o `{archivo, fuente, licencia, autor}` (lo rellena `iconos.py`). |

Nombre, alias y resumen NO van en la ficha: van en `i18n/es/religiones.json`.

**Símbolos**, por orden de preferencia:
1. Emblema libre de Wikimedia Commons (`iconos.py`), con autor y licencia en la ficha.
2. Dibujo propio (`simbolos.py`): motivo característico de la cultura (pilar en T de Göbekli Tepe, kanaga dogón, tambor de Dong Son…). `ficha.icono.fuente = "propio"` y `motivo` describe lo dibujado. Para añadir uno: definir el motivo con `@motivo`, asignarlo en `ASIGNACION` y ejecutar `python -m relitree.simbolos <id>` (`--forzar` para redibujar los propios).
3. Renacimiento moderno: adopta el símbolo de la religión que revive.
4. Rama sin emblema propio: muestra el símbolo de su tronco (`modelo.FAMILIAS_ICONO`) **atenuado y más pequeño**, para que se vea que no es la matriz. No heredan neopaganismos, filosofías, esoterismo ni nuevos movimientos.
5. Si nada de lo anterior, el glifo de su tipo. Nunca se usan logotipos registrados de organizaciones (Cienciología, Falun Gong, Unificación…).

**Alta de tradiciones:** añadir líneas a `backend/semilla/religiones.txt` y ejecutar `python -m relitree.sembrar` (solo crea las que no existen), o crear a mano la carpeta, la entrada de i18n y el artículo.

## Enciclopedia: normas (obligatorias en todas las fases y todas las religiones)

El plan completo, con la lista de artículos de cada fase, está en `enciclopedia/PLAN.md` (fases E00–E77).

**Extensión**
1. Todo artículo tiene **como mínimo 5.000 palabras**. Sin excepciones: ni resúmenes ni versiones abreviadas. Los artículos principales de las grandes religiones superan con mucho ese mínimo.
2. Cuando sobre una tradición se sabe poco (culturas arqueológicas, religiones extinguidas mal documentadas, movimientos breves), la extensión se alcanza con contenido real: contexto histórico y geográfico, registro arqueológico, fuentes antiguas y su fiabilidad, interpretaciones académicas y sus debates, comparación con tradiciones vecinas, legado y recepción. **Nunca se inventa**: lo hipotético se señala como hipótesis.

**Enfoque**
3. Cada religión se explica con el detalle con que la conocería alguien formado dentro de ella: creencias, mitos, doctrinas, mandamientos y normas, textos sagrados, ritos, calendario, festividades, vida cotidiana, organización, lugares sagrados y **simbología** (apartado obligatorio). Si está extinguida, todo lo que se sabe y cómo se sabe.
4. Historia completa y cronológica (Antigüedad, Edad Media, Moderna y Contemporánea cuando proceda): orígenes, causas, desarrollo, momentos de fuerza y de debilidad, relación con el poder, persecuciones sufridas y ejercidas, cismas y derivaciones.
5. Sin apartados genéricos tipo «luces y sombras»: los hechos, honrosos o vergonzosos, se cuentan en su momento histórico y con detalle. La polémica no se evita; se documenta y se presentan las posturas enfrentadas.
6. Tono neutral y respetuoso: se exponen las creencias como creencias («según la tradición…», «los fieles sostienen…») y se distingue lo que afirma la fe de lo que establece la investigación histórica.

**Estructura**
7. Todo episodio, figura o concepto mayor tiene **artículo propio** enlazado desde el principal: cada concilio, cada cruzada y guerra santa, cada cisma, cada revuelta, cada fundador, profeta, apóstol, papa o líder mayor, cada texto sagrado. Cuantas más subdivisiones, mejor.
8. Las listas extensas (papas, califas, imanes, gurús, patriarcas, dalái lamas, tirthankaras…) son completas: cada miembro con su propio apartado; los principales, además, con artículo propio. Las figuras menores pueden agruparse en artículos colectivos de ≥ 5.000 palabras.
9. Panteones: cada deidad con su apartado (iconografía, mitos, culto, símbolos, festividades, lugares). Hinduismo: **al menos 100 deidades**. Mismo criterio para los panteones egipcio, mesopotámico, griego, romano, nórdico, celta, mexica, maya, inca y yoruba.
10. Índice lateral en árbol, con anidación ilimitada (religión → categorías → subcategorías → artículos). Dentro del artículo, pestañas para las grandes secciones y desplegables cuando ayuden.
11. Recursos visuales: imágenes de Wikimedia Commons descargadas al repositorio con autor y licencia; diagramas, cronologías, mapas y tablas propios. Vídeo solo de fuentes institucionales oficiales (museos, universidades, organismos públicos, las propias instituciones religiosas), nunca de canales particulares.

**Rigor**
12. Cada artículo termina con sus fuentes (bibliografía académica y obras de referencia). Fechas, cifras y citas se contrastan antes de dar el artículo por completo. Las citas de textos sagrados, en traducciones de dominio público o parafraseadas.
13. Cabecera YAML en cada archivo: `estado` (borrador | completo), `fase`, `palabras`, `fuentes`. La compilación rechaza un artículo `completo` si su cuerpo tiene menos de 5.000 palabras. El recuento excluye títulos, citas numéricas, bibliografía, bloques citados, tablas y pies de figura. Los borradores nunca se contabilizan como artículos terminados. Abren con un aviso visible «Bloque en desarrollo» que indica su episodio y qué falta. Cuando un artículo completo remite parte de la materia a otro episodio, puede advertirlo al principio.

**Archivos**
14. Artículo principal: `enciclopedia/es/religiones/<id>.md`. Subartículos: `enciclopedia/es/religiones/<id>/<categoria>/<slug>.md`, con tantos niveles de carpeta como haga falta; cada carpeta lleva un `_indice.md` con su título y orden. Temas generales: `enciclopedia/es/temas/`. Imágenes: `enciclopedia/medios/`.
Los índices de categoría usan `_indice.md` con un encabezado `# Título` y, opcionalmente, `orden` numérico en la cabecera YAML. Por ejemplo, la carpeta `cristianismo/historia/concilios/` se muestra bajo Cristianismo → Historia → Concilios. Sus artículos usan enlaces como `[[cristianismo/historia/concilios/nicea-i|Nicea I]]`. Si el artículo de destino todavía falta, el lector muestra un aviso y permite regresar al artículo de origen.

En `cristianismo/concilios/`, encabezar cada artículo con el año o intervalo antes del nombre (por ejemplo, `# 553 · Concilio de Constantinopla II`) e indicar el primer año como `orden` en la cabecera YAML. El índice usa este valor para ordenar los concilios cronológicamente.

15. Al cerrar cada fase: actualizar `PLAN.md` y `tareas.md`, y dar los comandos PowerShell de git y de ejecución local.

## Criterios editoriales (obligatorios)

- **Contenido propio.** Selección, fechas, relaciones y textos se redactan a partir de fuentes académicas y enciclopédicas contrastadas (Wikipedia, Britannica, bibliografía especializada). No se transcriben ni calcan infografías, mapas o textos de terceros.
- **Iconos:** solo símbolos de dominio público o licencia libre (Wikimedia Commons), con la licencia anotada en la ficha; nunca logotipos registrados de organizaciones. Si no hay símbolo libre, se usa el glifo del tipo.
- Las fechas antiguas son aproximadas; en prehistoria se representan evidencias arqueológicas, no doctrinas.
- Una rama es una decisión editorial: cuando el origen es discutido, se elige el consenso mayoritario y se explica en el artículo.
- Tono neutral y respetuoso con todas las tradiciones, contando tanto sus luces como sus sombras, con hechos.

## Convenciones de interfaz (preferencias de Alejandro)

- Sin títulos sobre el lienzo; minimalismo, mucho aire; nada de cajetines ni filas de divisores.
- Barra superior fija con todos los botones juntos: buscar · filtros y capas · leyenda · enciclopedia (libro abierto) · Visualizaciones (ojo, selección de doce vistas con territorios por defecto) · tema · Acerca de. Sin controles de zoom (rueda, pellizco, teclas + − 0). **Alt + clic en Acerca de** abre Herramientas (exportar SVG, enlaces al editor Atlas, SQLite).
- Las visualizaciones del catálogo colocan sus controles a la izquierda de la barra superior y dedican la superficie inferior a los datos.
- El editor es un proyecto aparte: https://github.com/AlejandroPico/Editor (web: https://alejandropico.github.io/Editor/). Aquí solo se enlaza.
- Temas día / tarde / noche / automático (según fecha y hora locales).
- Todo vectorial: nada de imágenes de mapa de bits en el árbol.
- `favicon.svg` en la raíz del proyecto (obligatorio) y copia en `public/`.
- Panel de detalle: cabecera fija (símbolo, nombre, fechas, cerrar) y cuerpo desplazable sin barra de scroll visible.
- Índice de la enciclopedia conmutable: alfabético total o por territorios desplegables.
- La enciclopedia usa todo el ancho de pantalla y tiene botón de lectura en voz alta.
- Al cerrar cada fase: dar los comandos PowerShell de git y los de ejecución local; mantener `tareas.md` al día quitando lo terminado.

## Versionado de entregas

- En cada entrega publicada, incrementa la versión de Relitree y sincroniza `package.json`, la versión raíz de `package-lock.json` y `README.md`. La ficha «Acerca de» lee la versión de los metadatos generados a partir de `package.json`.
