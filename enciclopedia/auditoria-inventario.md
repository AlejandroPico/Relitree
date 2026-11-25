# Auditoría del inventario de Relitree

La revisión del 25 de noviembre de 2026 cubre los 113 commits de la rama pública `main` hasta la versión 1.7.83. Compara las fichas por identificador y las relaciones por origen, destino, clase y nivel de filiación. En la enciclopedia se comparan las rutas de los artículos y estudios en español. Se inspeccionaron también los atlas en JSON de la etapa anterior a Angular. El alcance son los archivos publicados en el repositorio.

## Dianética y Cienciología

Los catálogos públicos revisados no contienen una entidad o artículo independiente para Dianética. La 1.7.57 desarrolló la sección histórica sobre dianética dentro del artículo de Cienciología. En esa misma entrega se retiró la derivación desde el Nuevo Pensamiento. En la 1.7.82 se incorporó el icono oficial. La versión 1.7.83 incorporó a Thelema como influencia estudiada en la formación de la Cienciología. [Revisión 1.7.57](https://github.com/AlejandroPico/Relitree/commit/e646a7ed5208c6cfa047d7a57db531a6f27fabea) · [Icono 1.7.82](https://github.com/AlejandroPico/Relitree/commit/5648e761209980ae66386f67797ac32df457ceaa) · [Influencia 1.7.83](https://github.com/AlejandroPico/Relitree/commit/708f5093cd541b0b166d5ee78cf73eb6ee022215)

La 1.7.84 incorpora [Dianética](es/religiones/dianetica.md) como entidad de 1950 y antecedente directo de [Cienciología](es/religiones/cienciologia.md). Conserva la influencia de Thelema y el SVG oficial en Cienciología. Los dos artículos se enlazan y la nueva ficha entra en el índice y la búsqueda.

## Entidades y artículos del catálogo actual

La primera versión Angular versionó 329 identificadores de ficha. La 1.2 amplió el catálogo a 516 y conservó los identificadores anteriores. En las 104 revisiones del catálogo Angular hasta la 1.7.83 se detectaron **cero bajas de entidades**. Es una verificación del inventario por identificador. Una revisión editorial puede cambiar el nombre, la fecha, el alcance o una relación de una ficha. [Inicio de Angular](https://github.com/AlejandroPico/Relitree/commit/8b2d81ca1eac4cb7af8e873387843ae20cb34481) · [Ampliación de la 1.2](https://github.com/AlejandroPico/Relitree/commit/333dbe24ee17873767fede8c37638ac857e72cae)

Se retiraron ocho rutas de artículos en español. Los cambios de ruta corresponden a tres reorganizaciones del bloque cristiano.

| Entrega | Rutas anteriores | Destino |
|---|---|---|
| [1.7.22](https://github.com/AlejandroPico/Relitree/commit/fe037c03) | Introducción de Cruzadas | [Panorama en el bloque de Cruzadas](es/religiones/cristianismo/cruzadas/panorama.md) |
| [1.7.24](https://github.com/AlejandroPico/Relitree/commit/35bde320) | Artículo de conjunto sobre los concilios ecuménicos | [Panorama en el bloque de Concilios](es/religiones/cristianismo/concilios/panorama.md) |
| [1.7.42](https://github.com/AlejandroPico/Relitree/commit/5ee49811) | Cuatro artículos colectivos de Apóstoles y las fichas de Pedro y Pablo bajo Figuras | Doce fichas individuales en el [índice de Apóstoles](es/religiones/cristianismo/apostoles/_indice.md) y biografías en [Primeras comunidades](es/religiones/cristianismo/primeras-comunidades/figuras/_indice.md) |

## Relaciones revisadas

La ampliación de la 1.2 cambió ocho relaciones del catálogo inicial. Entre la 1.2 y la 1.7.83, diecisiete commits sustituyeron o retiraron 29 configuraciones de vínculo. Diecinueve cambiaron la clase conservando origen y destino. En los otros diez, el par dejó de figurar en esa entrega. La tabla recoge esos casos para que la diferencia entre una revisión de filiación y una posible omisión pueda cotejarse con su cambio original.

| Entrega | Relaciones retiradas con esos extremos |
|---|---|
| [1.7.54](https://github.com/AlejandroPico/Relitree/commit/ef29dce6) | Bogomilismo → catarismo, islam → iconoclasia, maniqueísmo → paulicianos y paulicianos → bogomilismo. El catálogo pasó a situar a bogomilismo y catarismo bajo el cristianismo. |
| [1.7.57](https://github.com/AlejandroPico/Relitree/commit/e646a7ed) | Luteranismo → swedenborgianismo y Nuevo Pensamiento → Cienciología. El mismo cambio reclasificó como influencia el vínculo del swedenborgianismo con el Nuevo Pensamiento. |
| [1.7.60](https://github.com/AlejandroPico/Relitree/commit/9ad65179) | Bautistas → adventismo. |
| [1.7.62](https://github.com/AlejandroPico/Relitree/commit/5959605c) | Religión inca → Israelitas del Nuevo Pacto Universal. |
| [1.7.71](https://github.com/AlejandroPico/Relitree/commit/f43b29f7) | Deísmo → positivismo. |
| [1.7.74](https://github.com/AlejandroPico/Relitree/commit/ba0cc89a) | Religiones bantúes → Zion Christian Church. En la entrega se añadió cristianismo como filiación y se registró el pentecostalismo como influencia. |

La 1.7.83 contenía en origen **516 entidades, 699 relaciones y 673 rutas de fichas y estudios en español**. La 1.7.84 conserva ese inventario y suma una entidad, una derivación y una ficha.

## La migración del atlas anterior a Angular

El último atlas anterior tenía 195 entradas sin el mismo esquema de identificadores. El cotejo por nombre, alias e identificador normalizados da 115 coincidencias exactas con la 1.7.83. Las 80 diferencias de esos campos incluyen cambios de nombre, división de entradas amplias y agrupaciones. Por ejemplo, Smartismo corresponde a [Tradición smarta](es/religiones/smarta.md). El Complejo ritual de Caral y la Religión Chavín tienen ficha como [Religión de Caral](es/religiones/caral.md) y [Culto de Chavín](es/religiones/chavin.md). La entrada Abangan del atlas antiguo carece de ficha homónima en el catálogo actual. Su correspondencia editorial precisa cotejo con las categorías de religión javanesa. La comparación nominal por sí sola no determina cuántas tradiciones desaparecieron de aquella versión. [Atlas anterior y nombres originales](https://github.com/AlejandroPico/Relitree/blob/e3c0a749/src/data/atlas.json) · [Migración a Angular](https://github.com/AlejandroPico/Relitree/commit/8b2d81ca)

## Comprobación en cada publicación

GitHub Actions compara la revisión que va a publicar con la que estaba en `main` antes del envío. Distingue la pérdida de una entidad, la eliminación o reclasificación de una relación, la retirada de una ruta de la enciclopedia y el paso de artículo completo a borrador. Si la revisión es intencionada, se documenta su clave, el commit base, el motivo y la fuente en `enciclopedia/revisiones-inventario.json`. El informe del control enumera las claves concretas. La comprobación se ejecuta antes de construir y publicar el sitio.

