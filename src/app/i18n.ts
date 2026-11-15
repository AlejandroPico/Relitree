import { Injectable } from '@angular/core';

type Idioma = 'es' | 'ca' | 'en' | 'fr' | 'de' | 'pt' | 'it';
const ORDEN: Idioma[] = ['es', 'ca', 'en', 'fr', 'de', 'pt', 'it'];

/** Textos de interfaz. Orden de cada fila: es, ca, en, fr, de, pt, it. El contenido histórico está, por ahora, en español. */
const T: Record<string, string[]> = {
  buscar: ['Buscar', 'Cerca', 'Search', 'Rechercher', 'Suchen', 'Pesquisar', 'Cerca'],
  buscarAyuda: ['Buscar una religión…', 'Cerca una religió…', 'Search a religion…', 'Rechercher une religion…', 'Religion suchen…', 'Pesquisar uma religião…', 'Cerca una religione…'],
  filtros: ['Filtros y capas', 'Filtres i capes', 'Filters and layers', 'Filtres et calques', 'Filter und Ebenen', 'Filtros e camadas', 'Filtri e livelli'],
  leyenda: ['Leyenda', 'Llegenda', 'Legend', 'Légende', 'Legende', 'Legenda', 'Legenda'],
  enciclopedia: ['Enciclopedia', 'Enciclopèdia', 'Encyclopedia', 'Encyclopédie', 'Enzyklopädie', 'Enciclopédia', 'Enciclopedia'],
  tema: ['Tema', 'Tema', 'Theme', 'Thème', 'Design', 'Tema', 'Tema'],
  dia: ['Día', 'Dia', 'Day', 'Jour', 'Tag', 'Dia', 'Giorno'],
  tarde: ['Tarde', 'Tarda', 'Evening', 'Soir', 'Abend', 'Tarde', 'Sera'],
  noche: ['Noche', 'Nit', 'Night', 'Nuit', 'Nacht', 'Noite', 'Notte'],
  auto: ['Automático', 'Automàtic', 'Automatic', 'Automatique', 'Automatisch', 'Automático', 'Automatico'],
  acerca: ['Acerca de', 'Quant a', 'About', 'À propos', 'Über', 'Sobre', 'Informazioni'],
  cerrar: ['Cerrar', 'Tanca', 'Close', 'Fermer', 'Schließen', 'Fechar', 'Chiudi'],
  territorios: ['Territorios', 'Territoris', 'Territories', 'Territoires', 'Gebiete', 'Territórios', 'Territori'],
  tipos: ['Tipos', 'Tipus', 'Types', 'Types', 'Typen', 'Tipos', 'Tipi'],
  capas: ['Capas', 'Capes', 'Layers', 'Calques', 'Ebenen', 'Camadas', 'Livelli'],
  influencias: ['Influencias', 'Influències', 'Influences', 'Influences', 'Einflüsse', 'Influências', 'Influenze'],
  extintas: ['Tradiciones extinguidas', 'Tradicions extingides', 'Extinct traditions', 'Traditions éteintes', 'Erloschene Traditionen', 'Tradições extintas', 'Tradizioni estinte'],
  rejilla: ['Líneas de fecha', 'Línies de data', 'Date lines', 'Lignes de date', 'Datumslinien', 'Linhas de data', 'Linee di data'],
  importancia: ['Importancia mínima', 'Importància mínima', 'Minimum importance', 'Importance minimale', 'Mindestbedeutung', 'Importância mínima', 'Importanza minima'],
  todo: ['Todo', 'Tot', 'All', 'Tout', 'Alle', 'Tudo', 'Tutto'],
  nada: ['Nada', 'Res', 'None', 'Rien', 'Keine', 'Nada', 'Niente'],
  origen: ['Procede de', 'Procedeix de', 'Derives from', 'Issu de', 'Stammt von', 'Procede de', 'Deriva da'],
  ramas: ['Ramas que nacen de ella', 'Branques que en neixen', 'Branches from it', 'Branches qui en naissent', 'Abzweigungen', 'Ramos que nascem dela', 'Rami che ne nascono'],
  recibe: ['Recibe influencia de', 'Rep influència de', 'Influenced by', 'Influencé par', 'Beeinflusst von', 'Recebe influência de', 'Influenzata da'],
  influye: ['Influye en', 'Influeix en', 'Influences', 'Influence', 'Beeinflusst', 'Influencia', 'Influenza'],
  abrirEnc: ['Leer en la enciclopedia', "Llegeix a l'enciclopèdia", 'Read in the encyclopedia', "Lire dans l'encyclopédie", 'In der Enzyklopädie lesen', 'Ler na enciclopédia', "Leggi nell'enciclopedia"],
  verArbol: ['Ver en el árbol', "Mostra a l'arbre", 'Show in the tree', "Voir dans l'arbre", 'Im Baum zeigen', 'Ver na árvore', "Mostra nell'albero"],
  wikipedia: ['Buscar en Wikipedia', 'Cerca a la Viquipèdia', 'Search Wikipedia', 'Chercher sur Wikipédia', 'In Wikipedia suchen', 'Pesquisar na Wikipédia', 'Cerca su Wikipedia'],
  hoy: ['hoy', 'avui', 'today', "aujourd'hui", 'heute', 'hoje', 'oggi'],
  ac: ['a. C.', 'aC', 'BC', 'av. J.-C.', 'v. Chr.', 'a.C.', 'a.C.'],
  temas: ['Temas generales', 'Temes generals', 'General topics', 'Thèmes généraux', 'Allgemeine Themen', 'Temas gerais', 'Temi generali'],
  leer: ['Leer en voz alta', 'Llegeix en veu alta', 'Read aloud', 'Lire à voix haute', 'Vorlesen', 'Ler em voz alta', 'Leggi ad alta voce'],
  filtrar: ['Filtrar…', 'Filtra…', 'Filter…', 'Filtrer…', 'Filtern…', 'Filtrar…', 'Filtra…'],
  exportar: ['Exportar SVG vectorial', 'Exporta SVG vectorial', 'Export vector SVG', 'Exporter en SVG vectoriel', 'Vektor-SVG exportieren', 'Exportar SVG vetorial', 'Esporta SVG vettoriale'],
  editor: ['Abrir el editor Atlas', "Obre l'editor Atlas", 'Open the Atlas editor', "Ouvrir l'éditeur Atlas", 'Atlas-Editor öffnen', 'Abrir o editor Atlas', "Apri l'editor Atlas"],
  editorRepo: ['Proyecto del editor (descarga e instalación)', "Projecte de l'editor (descàrrega i instal·lació)", 'Editor project (download and install)', "Projet de l'éditeur (téléchargement et installation)", 'Editor-Projekt (Download und Installation)', 'Projeto do editor (descarga e instalação)', "Progetto dell'editor (download e installazione)"],
  radial: ['Vista radial', 'Vista radial', 'Radial view', 'Vue radiale', 'Radialansicht', 'Vista radial', 'Vista radiale'],
  columnas: ['Vista por territorios', 'Vista per territoris', 'Territory view', 'Vue par territoires', 'Gebietsansicht', 'Vista por territórios', 'Vista per territori'],
  herramientas: ['Herramientas', 'Eines', 'Tools', 'Outils', 'Werkzeuge', 'Ferramentas', 'Strumenti'],
  instalar: ['Instalar como aplicación', 'Instal·la com a aplicació', 'Install as an app', "Installer comme application", 'Als App installieren', 'Instalar como aplicação', 'Installa come app'],
  repo: ['Código del proyecto', 'Codi del projecte', 'Project source', 'Code du projet', 'Projektcode', 'Código do projeto', 'Codice del progetto'],
  portfolio: ['Más proyectos del autor', "Més projectes de l'autor", 'More projects by the author', "Autres projets de l'auteur", 'Weitere Projekte des Autors', 'Mais projetos do autor', "Altri progetti dell'autore"],
  version: ['Versión', 'Versió', 'Version', 'Version', 'Version', 'Versão', 'Versione'],
  autor: ['Autor', 'Autor', 'Author', 'Auteur', 'Autor', 'Autor', 'Autore'],
  descripcion: [
    'El árbol de las religiones. Recorre cómo han nacido, se han dividido y se han mezclado las creencias de la humanidad, desde los primeros ritos de la prehistoria hasta hoy. Amplía sin límite, toca cualquier símbolo para saber qué es y sigue leyendo en la enciclopedia.',
    "L'arbre de les religions. Recorre com han nascut, s'han dividit i s'han barrejat les creences de la humanitat, des dels primers ritus de la prehistòria fins avui. Amplia sense límit, toca qualsevol símbol per saber què és i continua llegint a l'enciclopèdia.",
    'The tree of religions. Follow how humanity’s beliefs were born, split and blended, from the first prehistoric rites to the present day. Zoom without limit, tap any symbol to learn what it is and keep reading in the encyclopedia.',
    "L'arbre des religions. Découvrez comment les croyances de l'humanité sont nées, se sont divisées et mêlées, des premiers rites préhistoriques à aujourd'hui. Zoomez sans limite, touchez un symbole pour savoir ce qu'il est et poursuivez dans l'encyclopédie.",
    'Der Baum der Religionen. Verfolge, wie die Glaubensformen der Menschheit entstanden, sich teilten und vermischten – von den ersten Riten der Vorgeschichte bis heute. Zoome grenzenlos, tippe ein Symbol an und lies in der Enzyklopädie weiter.',
    'A árvore das religiões. Percorre como nasceram, se dividiram e se misturaram as crenças da humanidade, dos primeiros ritos da pré-história até hoje. Amplia sem limite, toca em qualquer símbolo para saber o que é e continua a ler na enciclopédia.',
    "L'albero delle religioni. Scopri come sono nate, si sono divise e mescolate le credenze dell'umanità, dai primi riti della preistoria a oggi. Ingrandisci senza limiti, tocca un simbolo per sapere che cos'è e continua a leggere nell'enciclopedia.",
  ],
  grosor: ['El grosor indica el peso histórico', 'El gruix indica el pes històric', 'Thickness shows historical weight', "L'épaisseur indique le poids historique", 'Die Stärke zeigt das historische Gewicht', 'A espessura indica o peso histórico', 'Lo spessore indica il peso storico'],
  lVida: ['Línea de vida de una tradición', "Línia de vida d'una tradició", 'Lifeline of a tradition', "Ligne de vie d'une tradition", 'Lebenslinie einer Tradition', 'Linha de vida de uma tradição', 'Linea di vita di una tradizione'],
  lRama: ['Rama: evolución, cisma o reforma', 'Branca: evolució, cisma o reforma', 'Branch: evolution, schism or reform', 'Branche : évolution, schisme ou réforme', 'Zweig: Entwicklung, Schisma oder Reform', 'Ramo: evolução, cisma ou reforma', 'Ramo: evoluzione, scisma o riforma'],
  lSecundaria: ['Segunda fuente de una fusión', "Segona font d'una fusió", 'Second source of a fusion', "Seconde source d'une fusion", 'Zweite Quelle einer Verschmelzung', 'Segunda fonte de uma fusão', 'Seconda fonte di una fusione'],
  lRenacer: ['Renacimiento moderno', 'Renaixement modern', 'Modern revival', 'Renaissance moderne', 'Moderne Wiederbelebung', 'Renascimento moderno', 'Rinascita moderna'],
  lInfluencia: ['Influencia', 'Influència', 'Influence', 'Influence', 'Einfluss', 'Influência', 'Influenza'],
  lFin: ['Tradición extinguida (aro discontinuo)', 'Tradició extingida (anell discontinu)', 'Extinct tradition (dashed ring)', 'Tradition éteinte (anneau en tirets)', 'Erloschene Tradition (gestrichelter Ring)', 'Tradição extinta (anel tracejado)', 'Tradizione estinta (anello tratteggiato)'],
  r_derivacion: ['Evolución', 'Evolució', 'Evolution', 'Évolution', 'Entwicklung', 'Evolução', 'Evoluzione'],
  r_cisma: ['Cisma', 'Cisma', 'Schism', 'Schisme', 'Schisma', 'Cisma', 'Scisma'],
  r_reforma: ['Reforma', 'Reforma', 'Reform', 'Réforme', 'Reform', 'Reforma', 'Riforma'],
  r_sincretismo: ['Fusión', 'Fusió', 'Fusion', 'Fusion', 'Verschmelzung', 'Fusão', 'Fusione'],
  r_renacimiento: ['Renacimiento', 'Renaixement', 'Revival', 'Renaissance', 'Wiederbelebung', 'Renascimento', 'Rinascita'],
  r_influencia: ['Influencia', 'Influència', 'Influence', 'Influence', 'Einfluss', 'Influência', 'Influenza'],
  cargando: ['Cargando…', 'Carregant…', 'Loading…', 'Chargement…', 'Laden…', 'A carregar…', 'Caricamento…'],
  creditoIcono: ['Símbolo', 'Símbol', 'Symbol', 'Symbole', 'Symbol', 'Símbolo', 'Simbolo'],
};

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly idioma: Idioma = (ORDEN.find((i) => (navigator.language || 'es').toLowerCase().startsWith(i)) ?? 'en');
  private readonly n = ORDEN.indexOf(this.idioma);
  constructor() { document.documentElement.lang = this.idioma; }
  t(clave: string): string { return T[clave]?.[this.n] ?? clave; }

  anio(a: number): string {
    const abs = Math.abs(a).toLocaleString(this.idioma);
    return a < 0 ? `${abs} ${this.t('ac')}` : abs.replace(/\D/g, '').length <= 4 ? String(a) : abs;
  }
  periodo(inicio: number, fin: number | null): string {
    return `${this.anio(inicio)} – ${fin === null ? this.t('hoy') : this.anio(fin)}`;
  }
}
