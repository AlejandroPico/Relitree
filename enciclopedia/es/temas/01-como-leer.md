---
estado: completo
fase: E01
palabras: 5363
fuentes:
  - "https://github.com/AlejandroPico/Relitree/blob/main/agentes.md"
  - "https://github.com/AlejandroPico/Relitree/blob/main/backend/relitree/escala.py"
  - "https://github.com/AlejandroPico/Relitree/blob/main/backend/relitree/trazado.py"
  - "https://github.com/AlejandroPico/Relitree/blob/main/src/app/lienzo.ts"
  - "https://github.com/AlejandroPico/Relitree/blob/main/src/app/app.html"
  - "https://github.com/AlejandroPico/Relitree/blob/main/src/app/enciclopedia.ts"
  - "https://plato.stanford.edu/entries/concept-religion/"
  - "https://whc.unesco.org/en/list/1572"
  - "https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/"
---

# Cómo leer el árbol

Relitree sitúa en una misma representación visual tradiciones religiosas, movimientos espirituales y escuelas de pensamiento que han aparecido en épocas y territorios muy distintos. Cada símbolo identifica una entrada del catálogo. Los ejes la sitúan en el tiempo y en una región, y las líneas muestran las relaciones que el proyecto ha incorporado a sus datos. Al abrir la ficha se pasa de esa vista sintética a los nombres, fechas, orígenes, influencias y ramas concretas. La enciclopedia permite después seguir esos indicios hasta una explicación histórica.

Para orientarse por primera vez, basta con escoger una tradición conocida y leer su ficha. El buscador de la barra superior lleva hasta el nodo. En la ficha se puede comprobar qué fecha representa el punto de partida y qué clase de relación une la tradición con su origen. Desde allí, el libro abre el artículo. También se puede empezar por el índice de la enciclopedia, recorrer sus temas generales y volver al árbol desde un artículo de una tradición. Ambos recorridos se complementan. El primero parte de una posición y busca su explicación. El segundo parte de una lectura y permite ver dónde se sitúa su protagonista.

Una regla sirve para las dos vistas. **La edad se lee en las marcas del eje, la ubicación en la región, la filiación en las ramas y la situación de una tradición en su ficha.** Si coinciden dos nodos en la misma altura, el dibujo les asigna fechas próximas. Si comparten región, el catálogo los presenta en un mismo territorio. Para afirmar que uno influyó en otro hace falta una línea de relación o una fuente que lo documente. Estas lecturas responden a preguntas distintas y conviene hacerlas por separado.

## Leyenda de lectura

| Qué se ve | Qué representa | Dónde comprobarlo |
|---|---|---|
| Símbolo con nombre y fechas | Entrada del catálogo ubicada según su inicio | Ficha de la tradición |
| Banda o sector de color | Territorio asignado a la entrada | Nombre de la banda y ficha |
| Línea que parte del símbolo | Tramo de su línea de vida dibujado por el trazado | Fechas de la ficha |
| Rama horizontal o arco | Origen principal de la tradición de destino | Relación de origen en la ficha |
| Curva continua más fina | Origen adicional | Lista de orígenes |
| Curva discontinua | Influencia registrada | Lista de influencias |
| Rama principal punteada | Renacimiento de una tradición anterior | Clase de relación en la ficha |
| Prolongación punteada tras el fin | Continuación gráfica hasta una rama posterior | Fecha de fin del origen |
| Aro discontinuo en el nodo | Tradición catalogada como extinguida | Fecha de fin |
| Emblema pequeño y atenuado dentro del nodo | Símbolo heredado de una familia de tradiciones | Crédito del símbolo |
| Variación del grosor | Estimación de fieles en el catálogo | Leyenda y fuente de la ficha |

![Esquema de un nodo, su línea de vida y la rama que lo une a un segundo nodo](datos/medios/e01-lectura-arbol.svg)

*Esquema de lectura. A y B representan entradas ficticias.*

La leyenda distingue deliberadamente el tramo punteado de una línea de vida y una rama punteada. Aunque ambos usan puntos, se leen siguiendo direcciones distintas. En columnas, el primero prolonga una línea vertical. La segunda sale hacia otro nodo. En radial, el primero sigue el radio y la segunda sigue un arco. En ambos casos la ficha termina de resolver la duda. Conviene usar el color como ayuda para localizar el territorio y la forma de la línea para reconocer el tipo de relación.

## El tiempo en las dos vistas

En la vista de columnas, las fechas recientes aparecen arriba y las antiguas abajo. Una línea horizontal que pase por dos nodos ayuda a comparar sus comienzos aproximados. En la vista radial, el centro contiene los periodos más antiguos y el borde los más recientes. Dos nodos situados a una distancia similar del centro ocupan fechas próximas, aunque el arco entre ellos pueda ser largo. En ambos casos, sigue las marcas de años para hacer la comparación. El cambio de vista reorganiza la misma información mediante otra geometría.

La escala es adaptativa. El programa divide la historia en intervalos y reserva más espacio donde necesita distribuir muchos comienzos. En los tramos antiguos, las marcas comprendidas entre 300.000 y 8.000 a. C. se separan por la misma distancia visual. Así, de 300.000 a 200.000 a. C. hay la misma altura que de 100.000 a 50.000 a. C., aunque el primer salto abarca el doble de años. Lo mismo ocurre en las marcas de 12.000, 10.000 y 8.000 a. C. Dentro de cada tramo, la distribución de años sigue siendo proporcional. Al cruzar una marca puede cambiar la cantidad de píxeles que representa un año. Las marcas impresas y la ficha proporcionan el dato temporal.

La densidad del dibujo depende también del catálogo. Si se incorporan nuevas tradiciones a un periodo, al regenerar el árbol ese periodo puede ganar espacio. Cambia el reparto gráfico, aunque las fechas de las tradiciones ya registradas sigan siendo las mismas. Una captura de una versión antigua puede por tanto mostrar una distribución diferente. Para citar una cronología conviene anotar los años que expresa la ficha, la tradición concreta y, cuando sea pertinente, el momento en que se consultó el proyecto.

La escala también condiciona la intuición sobre la continuidad. Una rama de aparición reciente podría verse separada de su origen por una distancia comparable a la que ocupa una larguísima etapa arqueológica. El usuario que quiera comparar duraciones debe restar los años o consultar el intervalo en la ficha. La longitud gráfica sirve para disponer relaciones legibles. Ese propósito explica por qué el árbol abre más espacio en un periodo con muchos nodos en lugar de reservar siempre la misma altura por siglo.

### Fechas antes y después de nuestra era

A los lados de la cuadrícula aparecen las referencias temporales. En los textos castellanos se usan fechas como «siglo V a. C.» o «siglo V d. C.». Para establecer qué hecho ocurrió antes en el primer caso, recuerda que un año 500 a. C. precede a uno 300 a. C. Las fechas muy remotas suelen presentarse como aproximaciones. Una cifra redonda puede condensar una datación estimada, el comienzo convencional de un periodo o la fecha de la evidencia elegida. El artículo histórico da el contexto para interpretar esa cifra.

Aunque el programa necesita una coordenada para cada nodo, una tradición puede haberse constituido a lo largo de varias generaciones. Una fecha de inicio puede corresponder a la primera evidencia conservada, una aparición pública, una formulación doctrinal o la institución de una comunidad. Esas fechas son comparables con cautela, porque responden a convenciones diferentes. Una inscripción que menciona una práctica, por ejemplo, establece que existía en esa fecha o antes. Una disposición oficial acredita una decisión de las autoridades. Una narración sobre un fundador preservada en un texto posterior plantea preguntas diferentes sobre transmisión, género y contexto.

Un buen ejercicio consiste en escoger dos tradiciones cercanas en la cuadrícula y formular la comparación en palabras. Primero indica qué fecha usa cada entrada. Después especifica, cuando sus artículos lo expliquen, si las fechas representan fundaciones, testimonios, procesos o convenciones. Por último señala la precisión de la conclusión. «Los dos comienzos convencionales están próximos» puede ser una lectura correcta incluso cuando «ambas comunidades se fundaron simultáneamente» exigiría documentación adicional. Así se conserva la utilidad del esquema sin atribuirle una precisión mayor que la de sus datos.

## El espacio y los territorios

En columnas, el eje horizontal reúne once territorios. La vista radial transforma cada banda en un sector. Se usan África, Europa, Oriente Próximo, Asia Central y Septentrional, Asia Meridional, Asia Oriental, Sudeste Asiático, Oceanía, Norteamérica, Mesoamérica y Caribe, y Sudamérica. Son unidades de organización de la pantalla. Un nodo situado dentro de una columna figura en el territorio asignado a esa entrada del catálogo. El lugar de origen aproximado, la expansión posterior y la distribución actual se investigan por separado.

| Pregunta geográfica | Qué consultar |
|---|---|
| ¿En qué territorio está catalogada la entrada? | Banda o sector y ficha |
| ¿Dónde surgieron las prácticas o instituciones descritas? | Relato histórico y fuentes |
| ¿Dónde se extendió la tradición después? | Artículo, cronología y mapas de expansión |
| ¿Dónde viven hoy sus miembros? | Encuestas y censos con fecha y método |
| ¿Qué tradiciones de otras regiones influyeron en esta? | Relaciones, nombres de origen y bibliografía |

La anchura de las bandas responde a la colocación de los nodos. En el trazado completo, cada tradición tiene su propio carril, incluso cuando su intervalo de vida coincide por completo con el de varias tradiciones de la misma región. Al colocar dos ramas de un mismo origen en una región, la más antigua dispone primero del carril libre más cercano a ese origen. Las demás ocupan los siguientes espacios disponibles. Un sector radial amplio ocupa el espacio que necesita su disposición. Las dimensiones de los sectores representan la geometría del dibujo y los nombres de las regiones indican el territorio asociado a cada entrada.

La posición de izquierda a derecha en una columna también obedece al trazado. Si dos nodos tienen carriles contiguos, esa cercanía puede venir de su filiación, de la necesidad de dejar espacio para otras líneas o de ambos factores. El criterio firme para leer la relación es el enlace que une los nodos y el texto de su ficha. Esto resulta especialmente importante en grupos densos, en los que se cruzan muchas líneas. Conviene seleccionar un nodo, observar qué relaciones resalta la interfaz y después abrir la relación o el artículo que se quiere interpretar.

Al cruzar regiones, una rama puede cambiar de color mediante un degradado. Esa transición marca dos territorios distintos en los extremos. El trayecto pintado entre ellos pertenece al gráfico. Para investigar una difusión histórica se necesitan los puertos, ciudades, pasos fronterizos, lenguas o comunidades que aparecen en los estudios del caso. Una rama del árbol puede sintetizar contactos desarrollados por rutas distintas y en momentos separados. El [[mapa-religioso-actual|artículo de demografía religiosa]] plantea otra pregunta geográfica, centrada en cómo se cuenta a las personas en un territorio y un año determinados.

## Nodos, símbolos y líneas de vida

El nodo es el punto de referencia. El título muestra el nombre de la entrada y la ficha añade su tipo, territorio, fechas y datos relacionados. Una entrada puede abarcar un conjunto amplio, como una familia religiosa, o describir una tradición más concreta. Antes de comparar dos nodos, comprueba qué escala tiene cada uno. Una tradición mundial podría contener muchas iglesias, escuelas o corrientes representadas en otros nodos. Una comparación demográfica entre el conjunto y una de sus partes debe tener en cuenta esa inclusión.

El símbolo ayuda a localizar una entrada entre muchas otras. Relitree puede presentar un símbolo propio, usar un emblema heredado de un tronco, mostrar un motivo dibujado para representar una cultura o recurrir al glifo general de un tipo. Los emblemas heredados se presentan atenuados y más pequeños. El crédito del artículo ayuda a reconocer la procedencia y el estatuto del dibujo. Así, un elemento gráfico útil para navegar puede interpretarse con la cautela que corresponde cuando se pregunta por sus usos históricos.

Para observar esta distinción, elige dos ramas próximas que compartan un símbolo. Amplía la vista hasta distinguir su tamaño y abre ambas fichas. Si una emplea el emblema heredado, el parecido tiene una explicación editorial. Si las dos tienen símbolos propios parecidos, investiga si comparten un repertorio histórico, una convención artística o simplemente una geometría fácil de confundir. El artículo de [[simbologia-religiosa|simbología religiosa comparada]] explica cómo estudiar la fecha, soporte y contexto de estas imágenes.

### Cuándo termina la línea dibujada

La línea de vida parte del nodo y corre hacia fechas posteriores. Con la capa de líneas completas activa, si la ficha termina en «Hoy», la parte continua de la línea llega hasta la marca del presente. En columnas lo hace de abajo arriba. En radial avanza hacia el anillo exterior. Si la ficha indica una fecha de fin, la línea continua termina en esa fecha. Puede haber además una prolongación punteada cuando una rama posterior necesita conectarse con su origen. El aro discontinuo del nodo y las fechas que figuran en la ficha permiten confirmar el estado asignado en el catálogo.

En «Filtros y capas», la opción «Todas las líneas vigentes hasta hoy» está marcada al entrar. Al desmarcarla se aplica el trazado compacto. Los troncos principales conservan su línea y las tradiciones secundarias solo la dibujan hasta su última rama. Cuando ninguna rama sale de una tradición secundaria, el símbolo basta para situar su inicio. Esto permite que dos nodos de periodos distintos ocupen el mismo carril. La fecha de la ficha sigue indicando el estado de cada tradición. Las dos vistas usan la misma opción y reajustan su encuadre al cambiarla.

Imagina una escuela vigente desde 1500 de la que se separa una comunidad en 1750. A esa altura aparece una rama hacia el nuevo nodo y la línea de la escuela sigue hasta hoy. La comunidad derivada ocupa su carril, con el final que figure en su propia ficha. Otro caso parte de una comunidad antigua con una fecha de fin y de un movimiento moderno que recupera elementos suyos. Si el gráfico prolonga la línea antigua hasta alcanzar la rama moderna, el tramo posterior a su final queda punteado. Así se puede seguir el enlace y localizar por separado el periodo de actividad de la comunidad anterior.

En una tradición catalogada como extinguida, el año final también exige interpretación histórica. Puede señalar el último testimonio conocido, la desaparición de una institución, el abandono de una práctica o un límite convencional. Una forma desaparecida puede dejar vocabulario, relatos, monumentos y técnicas rituales, y esa recepción puede merecer un artículo propio. En la tradición nueva conviene buscar por separado los elementos que se recuperan, los aportes modernos y la documentación que conecta uno y otro momento.

## Relaciones entre tradiciones

Una filiación relaciona una entrada de origen y otra de destino. La primera relación de origen se presenta como principal. Si hay orígenes adicionales, el gráfico los dibuja mediante curvas más ligeras. Cuando dos posibles explicaciones compiten, el artículo es el sitio para describir por qué el catálogo usa una y qué aspectos siguen discutidos. Esta distinción conserva la utilidad de un trazo principal, que permite seguir un itinerario por la pantalla, y deja espacio para explicar una historia con varias voces.

| Clase | Pregunta que permite formular |
|---|---|
| Derivación | ¿Qué hereda la nueva comunidad y en qué sentido adquiere una identidad diferenciada? |
| Cisma | ¿Qué autoridad o comunión se divide y cómo se reconoce esa separación? |
| Reforma | ¿Quién propone una reorganización y qué prácticas o doctrinas altera? |
| Sincretismo | ¿Qué tradiciones intervienen en la formación de una nueva configuración? |
| Renacimiento | ¿Qué tradición anterior se reivindica y a través de qué fuentes se reconstruye? |
| Influencia | ¿Qué idea, práctica o forma de organización circula entre tradiciones? |

Las primeras cinco clases pueden expresar un origen dentro del esquema de Relitree. La influencia se registra de forma separada. El hecho de que una fuente intercambie ideas con otra no basta para clasificar la segunda como rama de la primera. Por ejemplo, una comunidad puede adoptar una lengua litúrgica, un género textual o una técnica artística de su entorno y preservar una trayectoria institucional distinta. A la inversa, una ruptura institucional puede dejar creencias, calendarios y hábitos muy parecidos a los de la comunidad de origen.

Estos tipos de relación son selecciones editoriales. Para un proceso largo de cambio, un documento legal puede destacar la división institucional, una historia intelectual puede subrayar la reforma doctrinal y una descripción etnográfica puede mostrar continuidades cotidianas. El gráfico ha de elegir un trazo, mientras que las fuentes admiten esos niveles de lectura simultánea. Cuando se emplea el árbol para estudiar un periodo, resulta útil identificar en qué nivel se hace cada afirmación. «La autoridad se dividió» y «la oración familiar continuó en formas parecidas» pueden coexistir.

### Fuentes secundarias e influencias lejanas

Cuando una entrada tiene varios orígenes, la rama principal es más visible y el origen adicional puede aparecer como curva continua. Las influencias llevan un trazo discontinuo. Las influencias que enlazan regiones diferentes o nodos muy separados se pueden reservar para cuando se selecciona una de las tradiciones implicadas. Además, el panel de capas permite activar o desactivar la visualización de influencias. Si una relación consta en la ficha y cuesta encontrar su dibujo, comprueba primero la capa, selecciona uno de los extremos y acerca la vista.

La dirección importa. Una tradición puede recibir influencias de una y ejercerlas sobre otra en fechas o contextos diferentes. En la ficha aparecen por separado las entradas de las que recibe influencias y las que reciben la suya. Un ejemplo esquemático ayuda a practicar. Si una fuente de ideas A influye en B y B es origen de C, el catálogo muestra una conexión de influencia entre A y B y una filiación entre B y C. Para decir que C recibió una práctica concreta de A a través de B hay que identificar esa práctica en cada una de las etapas. La proximidad entre las tres flechas aporta una hipótesis que se puede investigar.

### El cisma y la reforma vistos a dos escalas

Algunos procesos históricos reciben fechas simbólicas porque un acto documentado los hace fáciles de reconocer. La separación entre autoridades puede, sin embargo, tener antecedentes de siglos y consecuencias que se concretan más tarde. Al estudiar el caso, conviene distinguir la fecha que organiza el árbol de los episodios que el artículo narra a ambos lados de ella. Una rama a una altura concreta muestra dónde puede empezarse la lectura. El texto permite conocer el ritmo desigual del proceso y examinar qué grupos vivieron la ruptura de una manera distinta.

Algo semejante ocurre con las reformas. Un movimiento puede empezar dentro de una institución y solo más tarde constituirse como tradición independiente. Sus promotores pueden reclamar una restauración de prácticas anteriores, mientras sus adversarios los acusan de innovación. Ambas voces pertenecen a la historia del movimiento. La relación de reforma del árbol indica que esa transformación pesa en la decisión editorial sobre su origen. Para una lectura equilibrada se ponen en relación los documentos de las partes, las prácticas que se mantuvieron, los cambios observables y el momento en que surge una estructura diferenciada.

## Herramientas de navegación

En escritorio, la rueda amplía o reduce alrededor de la posición del cursor. Arrastrar mueve el lienzo. En pantallas táctiles, arrastrar con un dedo desplaza la vista y el gesto de pinza permite acercarse o alejarse. Con el foco fuera del buscador y la enciclopedia cerrada, «+» acerca, «−» aleja y «0» restablece la vista inicial. Las flechas desplazan el lienzo. «Esc» quita la selección en esa misma situación. En algunos equipos hay que hacer clic en el lienzo para que la ventana reciba las pulsaciones.

El botón de vista permite alternar entre columnas y radial. Si la pregunta principal compara un conjunto de fechas, puede resultar más cómodo seguir marcas horizontales en columnas. Si interesa observar cómo se reparte el catálogo alrededor de un origen temporal, se puede pasar a la distribución radial y seguir los anillos. Un itinerario se puede verificar en las dos: localiza el mismo símbolo, anota su fecha y región y sigue una relación hasta el mismo destino. Es un modo directo de aprender qué cambia con la proyección.

El buscador del árbol devuelve tradiciones según los datos de su nombre y alias disponibles. Si una búsqueda por una variante no da el resultado esperado, prueba el nombre más habitual de la entrada, consulta por territorios o intenta un término más corto. Las etiquetas visibles dependen del zoom, el espacio y la prioridad de los nodos. Un nombre puede quedar oculto para evitar que se solape con otro, aunque su símbolo siga presente. Cuando la búsqueda lleva a una tradición, la selección hace más visible el nodo y presenta su ficha.

Las capas y filtros sirven para plantear preguntas más concretas. Desactivar la capa de influencias ayuda a examinar filiaciones. Ocultar tradiciones extintas puede despejar el espacio para ver algunas entradas vivas, aunque la lectura de sus antecedentes puede exigir volver a mostrar las extintas. Activar filtros de territorio o tipo acota las entradas visibles. Al interpretar un aparente vacío en la pantalla, revisa los filtros y el zoom. También puede tratarse de una zona con información escasa o de una tradición aún fuera del catálogo.

### Del nodo al artículo y vuelta

El libro de la barra superior abre la enciclopedia. Si hay una tradición seleccionada, se intenta abrir su artículo. Sin selección, se accede a esta guía. En el panel de una tradición hay también un enlace a su artículo cuando está disponible. En la enciclopedia puedes alternar el índice alfabético y territorial, desplegar categorías y subcategorías, seguir enlaces y usar el botón de volver al árbol en una entrada de tradición. Cuando está abierta una página de temas generales, la navegación relevante es el índice lateral y las remisiones dentro del texto.

El filtro del índice encuentra títulos y conserva la ruta de categorías hacia las coincidencias y el lector de voz puede comenzar desde el principio o desde texto seleccionado. Las novedades de infraestructura se documentan en la fase E00. Los artículos de E01 explican los conceptos necesarios para leer el proyecto y ofrecen recorridos entre ellos. Para una pregunta que todavía está en estudio, una remisión puede señalar el artículo previsto. La información disponible, la pregunta abierta y el estado de la entrada cumplen funciones distintas. En las fuentes bibliográficas se puede continuar la consulta mientras se desarrolla el artículo correspondiente.

## Cómo interpretar las fichas históricas

Antes de usar un dato fuera de Relitree, identifica qué representa. En las fechas busca el hecho o el testimonio que sirve de referencia. En los nombres observa si se usa un autonombre, una denominación académica o una etiqueta retrospectiva. En el territorio lee el punto de partida del catálogo y consulta la expansión en la historia correspondiente. En el tipo localiza la característica que explica su asignación. En las relaciones separa las formas de origen y de influencia. Estas precauciones son especialmente importantes cuando se comparan varios siglos o tradiciones para las que existen conjuntos de fuentes muy diferentes.

Una cronología histórica puede incluir a la vez información arqueológica, afirmaciones transmitidas por la comunidad y reconstrucciones de especialistas. Si una persona pregunta «¿cómo se sabe?», la respuesta debe nombrar qué clase de prueba se está utilizando. Un resto material se fecha y se interpreta en contexto. Un manuscrito se estudia atendiendo a su forma, transmisión y copia. Una encuesta depende de sus preguntas y de la muestra. Una afirmación de fe se puede explicar mediante sus textos y usos, respetando el sentido que tiene para quienes la profesan.

También importa distinguir una fuente primaria de la edición moderna que permite consultarla. Una inscripción antigua, un escrito emitido por autoridades, una fotografía de una ceremonia o un testimonio grabado documentan aspectos del contexto en que se produjeron. Una edición crítica, una síntesis historiográfica o una monografía pueden comparar testimonios y proponer una interpretación. Cuando fuentes de naturaleza diversa coinciden en una fecha o una relación, conviene indicar qué aporta cada una. Si discrepan, el artículo debe conservar la discrepancia relevante y explicar sus posibles causas.

Los nombres presentan otro problema. Una misma tradición puede tener transliteraciones diferentes, nombres en distintas lenguas y denominaciones aplicadas por terceros. El buscador ofrece las formas que el catálogo haya recogido. El lector puede encontrar otro nombre en una edición antigua o en los documentos de una asociación contemporánea. La vía más segura para decidir si dos nombres designan lo mismo es comprobar a qué prácticas, instituciones y periodos se refieren. En algunas ocasiones hay equivalencia. En otras, el nombre más general abarca varios movimientos que conviene mantener separados.

### Tamaño, grosor y número de fieles

El grosor del trazo aumenta con la estimación de fieles registrada en la ficha. El dibujo usa una escala logarítmica para que se distingan comunidades de tamaños muy diferentes. Dos veces el grosor, por tanto, representa una relación que depende de esa escala. Cuando falta la estimación se usa un trazo fino de referencia. El tamaño del nodo y la prioridad de los rótulos siguen expresando relevancia editorial. Para comparar una familia con una de sus ramas, comprueba si la estimación general ya incluye a la rama. En ambos casos examina qué fuente respalda la cifra y en qué sentido usa «fiel», «miembro» u otra categoría.

La comparación entre dos estimaciones requiere comprobar el año, el territorio y la población que se cuenta. Un registro institucional puede incluir personas que participaron en un rito de incorporación. Un censo puede registrar su identificación declarada. Un estudio de práctica puede preguntar con qué frecuencia se asiste a una actividad. Cada método describe una dimensión. Una cifra ausente en la ficha indica que no se ofrece una estimación utilizable allí. Cero personas y ausencia de datos son resultados distintos. El [[mapa-religioso-actual|estudio de demografía]] desarrolla estas distinciones.

## Qué cambia al retroceder a la prehistoria

En la parte más remota del árbol encontrarás entradas que se refieren a indicios materiales y tradiciones arqueológicas. Una cultura arqueológica reúne semejanzas en ciertos restos dentro de un marco cronológico y espacial. Los equipos que excavan estudian la posición de los objetos, sus materiales, los restos humanos y animales asociados, y los sucesivos usos del lugar. Ese conjunto de indicios permite hacer preguntas sobre conducta ritual. Para recuperar nombres de deidades, oraciones o teologías se necesitarían testimonios de otra naturaleza.

Comparar un enterramiento, una pintura en roca y una estructura monumental ilustra el cambio de escala. Un enterramiento puede conservar decisiones sobre el tratamiento de los muertos. Una imagen puede demostrar que hubo una elección deliberada de tema, superficie y técnica. Una construcción puede informar sobre el trabajo coordinado y el uso colectivo del lugar. Cada caso tiene preguntas abiertas sobre cronología, acceso, función y significados. El artículo sobre [[origenes-pensamiento-religioso|prehistoria y pensamiento religioso]] profundiza en cómo se ensayan y se contrastan esas interpretaciones.

Las fechas obtenidas por medios arqueológicos dependen también de qué se ha medido. Un material fechado puede haber estado en contacto directo con el objeto que interesa, formar parte de una capa superior que aporta un límite o haber llegado al lugar en un episodio posterior. Por eso un intervalo de datación y un año redondo dibujado por el proyecto cumplen papeles diferentes. Un lector que quiera examinar la precisión puede ir de la cifra general a las fuentes y preguntar qué elemento se fechó, con qué método y con qué relación respecto del resto del conjunto.

## Recorridos para practicar

### De una tradición al conjunto de sus relaciones

1. Busca [[cristianismo|Cristianismo]] en el árbol y selecciona el nodo.
2. Lee el nombre, la región y la fecha que presenta la ficha.
3. Busca los bloques de orígenes, ramas e influencias. Escoge una entrada de cada bloque que esté disponible.
4. Sigue una de las relaciones en el gráfico y comprueba su clase.
5. Abre el artículo general, localiza la sección histórica que introduce el contexto y toma nota de qué parte de la relación explica.

El ejercicio se puede realizar con otras tradiciones sin cambiar el procedimiento. Si la entrada de destino está más lejos de lo que permite la vista, usa el buscador o el enlace de la ficha. Si ambas tienen muchos nodos cerca, selecciona una para destacar sus relaciones. El resultado que interesa escribir es una frase con sujeto, relación y término, por ejemplo «la ficha presenta A como origen de B». Después se puede añadir una segunda frase sobre el hecho concreto en que se apoya esa clasificación.

### De un periodo a dos tradiciones coetáneas

1. Elige un tramo marcado en el eje temporal.
2. Localiza dos nodos de territorios distintos con posiciones cronológicas cercanas.
3. Anota los años y qué representa cada uno, si el artículo lo aclara.
4. Comprueba si hay relación entre esos nodos y si la ficha nombra otros vínculos.
5. Cambia a radial y vuelve a comparar su distancia al centro mediante las marcas de edad.

El ejercicio enseña a distinguir simultaneidad, vecindad e intercambio. Dos tradiciones pueden compartir periodo y presentar características comparables aunque no conste un contacto histórico entre ellas. Para convertir el parecido en hipótesis de difusión se necesita un mecanismo plausible y fuentes sobre circulación de personas, prácticas o documentos. Si esa prueba falta, todavía es posible comparar los dos casos señalando semejanzas y diferencias y manteniendo abiertas sus explicaciones.

### De una etiqueta a una pregunta histórica

1. Escoge dos nodos con el mismo tipo.
2. Abre [[tipos|Tipos de religión]] y localiza qué rasgo quiere resaltar la categoría.
3. Lee cómo se expresa ese rasgo en cada entrada.
4. Identifica dos aspectos en los que difieren, como la autoridad, la práctica familiar, la transmisión o el lugar de culto.
5. Decide qué rótulo describe mejor la pregunta que te interesa y qué datos te faltan.

El tipo permite encontrar casos comparables. Después, el análisis debe devolverles sus diferencias. Una comparación de prácticas en un templo podría ser muy distinta de una comparación sobre doctrina filosófica o pertenencia jurídica. El artículo sobre [[que-es-una-religion|qué es una religión]] reúne los enfoques para formular esas preguntas. El [[glosario-general|glosario]] ayuda a mantener un sentido consistente de los términos cuando se pasa de una entrada a otra.

### De una cifra a su contexto

Escoge una tradición con una cifra de fieles. Abre la fuente, si está disponible, y registra tres datos: año de referencia, población cubierta y criterio de pertenencia. Busca si la cifra representa un caso central, un intervalo o una estimación que reúne investigaciones distintas. Luego prueba a compararla con una segunda cifra. Si una mide autoidentificación y la otra inscripción formal, conserva ambas con su etiqueta y evita sumarlas directamente. Si una entrada del catálogo engloba a la segunda, comprueba el solapamiento antes de calcular un total.

Este itinerario permite detectar otra confusión frecuente. La magnitud de un grupo y su peso porcentual en la sociedad son medidas separadas. Una comunidad puede crecer en miembros y bajar como porcentaje si la población en la que se cuenta aumenta más deprisa. En sentido inverso, una proporción puede subir aunque apenas se modifique el número de personas. Las comparaciones en el tiempo deben exponer ambos valores cuando estén disponibles y conservar el denominador de cada estimación.

## Consultar, contrastar y volver al árbol

Relitree es especialmente legible cuando la consulta alterna la geometría y las fuentes. Parte de una pregunta pequeña, identifica el elemento que permite localizarla y abre la ficha para leer su significado. Si la pregunta se refiere a un vínculo, sigue la rama hasta ambos extremos. Si se refiere a una fecha, busca el hecho que representa. Si se refiere a un territorio, compara la ubicación inicial con la difusión. Consulta después el artículo, anota las fuentes que sustentan la respuesta y vuelve a ver cómo el árbol sintetiza la información.

Para una lectura más extensa, usa los temas generales como referencias de consulta. Los artículos de [[textos-sagrados|textos sagrados]] y [[calendarios-festividades|calendarios y festividades]] sirven para comparar prácticas que atraviesan varias familias. El de [[historia-estudio-religiones|historia del estudio de las religiones]] explica de dónde proceden muchos de los términos que ha utilizado la investigación. La función de las remisiones es mantener accesibles las preguntas relacionadas y permitir un recorrido en el orden que pida cada consulta.

El árbol también permite localizar una discrepancia concreta y describirla de forma verificable. Anota el identificador o el nombre de la entrada, la fecha o relación representada, la fuente que da otra información y lo que cubre esa fuente. Es distinto discutir el año de un hallazgo y discutir si ese hallazgo justifica la fecha elegida para una tradición. Una observación así puede convertirse en una nota bibliográfica, una revisión de la clasificación o una ampliación de la cronología. Una enciclopedia extensa gana precisión cuando las dudas se pueden leer, rastrear y revisar en el lugar al que pertenecen.

## Leer un recorrido sin perder la escala

Al comparar dos tradiciones, conviene decidir primero qué se está comparando. Si interesa la cronología, hay que leer las marcas de tiempo del árbol y la fecha consignada en cada ficha. Si la pregunta se refiere a continuidad institucional, hacen falta el tipo de relación y sus notas. Si se trata de intercambios de prácticas, una línea de influencia puede ofrecer el punto de partida para localizar casos. Limitarse al tamaño visual de los elementos mezcla esas dimensiones. Un grupo representado con poca superficie o con menos ramificaciones puede resultar central para una investigación sobre un territorio o una práctica concreta.

Supongamos que una tradición presenta una línea de vida larga, una derivación y una conexión de influencia hacia otro territorio. El primer dato describe su intervalo de representación. La derivación afirma un vínculo de origen de acuerdo con lo consignado en la ficha de destino. La influencia permite hablar de circulación de una enseñanza, de prácticas o de contactos, según la documentación. Una investigación puede registrar los tres datos en columnas separadas y añadir el pasaje o la fuente que los respalda. Si la línea continúa después del intervalo que interesa, un recorte por fechas permite situar el episodio sin atribuir a las épocas restantes las mismas relaciones.

También resulta útil distinguir una fecha desconocida de una fecha aproximada. Una fecha aproximada expresa un intervalo o una convención respaldada en alguna medida por la documentación. Una ausencia de fecha puede deberse a falta de fuentes, a un desacuerdo entre especialistas o a una decisión editorial de reservar el detalle para el artículo. Para entender cuál de estas situaciones se aplica, hay que seguir el enlace y examinar cómo se explica el comienzo o el final. En muchos casos se puede datar una inscripción, una institución reconocida o el nombre de un grupo con más precisión que la aparición de sus primeras prácticas.

### Del árbol al índice del artículo

El índice lateral permite abrir una tradición y recorrer sus categorías. Al seleccionar un artículo, sus secciones se muestran bajo el título de la entrada. La ruta encima del texto reúne la tradición y las categorías por las que se ha llegado a él. En textos con referencias numeradas, pulsar una referencia lleva a las fuentes correspondientes. Estos enlaces permiten pasar de una pregunta general a un pasaje y desde allí a la evidencia, sin perder la relación del artículo con el conjunto. Se puede usar esta navegación para leer dos apartados consecutivos o para comparar cómo se trata un asunto parecido en tradiciones diferentes.

Si el artículo incluye una síntesis cronológica o un esquema, conviene comprobar qué se ha seleccionado para dibujarlo. Un esquema puede mostrar una secuencia argumental, un tramo del calendario o un conjunto de relatos comparados. La leyenda y las referencias indican cuáles son sus límites. Por ejemplo, si dos relatos sitúan una escena en fechas distintas, un esquema que conserva ambas secuencias permite ver el desacuerdo. Esta visualización aporta algo diferente de una línea temporal que adopta una sola fecha como convención.

## Fuentes

- Relitree. [Guía para agentes y colaboradores](https://github.com/AlejandroPico/Relitree/blob/main/agentes.md). Convenciones de regiones, relaciones, símbolos y trazado.
- Relitree. [Código de la escala temporal](https://github.com/AlejandroPico/Relitree/blob/main/backend/relitree/escala.py) y [algoritmo de trazado](https://github.com/AlejandroPico/Relitree/blob/main/backend/relitree/trazado.py). Definición de intervalos, carriles y líneas de vida.
- Relitree. [Lienzo](https://github.com/AlejandroPico/Relitree/blob/main/src/app/lienzo.ts), [interfaz](https://github.com/AlejandroPico/Relitree/blob/main/src/app/app.html) y [lector de la enciclopedia](https://github.com/AlejandroPico/Relitree/blob/main/src/app/enciclopedia.ts). Controles, leyenda, selección y lectura.
- Kevin Schilbrack. [The Concept of Religion](https://plato.stanford.edu/entries/concept-religion/). Stanford Encyclopedia of Philosophy. Enfoques comparativos y problemas de definición.
- UNESCO World Heritage Centre. [Göbekli Tepe](https://whc.unesco.org/en/list/1572). Ejemplo de documentación arqueológica y de sus interpretaciones.
- Conrad Hackett y colaboradores. [How the Global Religious Landscape Changed From 2010 to 2020](https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/). Pew Research Center, 2025. Criterios para comparar tamaños y porcentajes.
