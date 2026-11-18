import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Datos, Relacion, Religion } from './datos';
import { Estado } from './estado';
import { I18n } from './i18n';
import { UI } from './glifos';
import { Grupo, NodoGrafo, POR_FECHA, ascendencia, cronograma, dibujarGrafo, marcasAdaptativas, nivelesGrafo, origenes, resaltarGrafo } from './analisis';

import { CamaraTemporal, Desplazamiento } from './desplazamiento';
import { ReglaTemporal } from './regla-temporal';

const MARCADORES: Record<string, [number, number, number, number]> = {
  afr: [19, 2, 0, 21], eur: [12, 51, -10, -20], opr: [41, 33, -8, 22],
  asn: [82, 57, 0, -20], asm: [77, 22, 9, 21], aso: [117, 36, 9, -17],
  sea: [105, 2, 7, 21], oce: [148, -25, 0, 23], nam: [-105, 46, 0, -21],
  mes: [-90, 16, 0, -18], sam: [-60, -16, 0, 23],
};

// Entradas generales del catálogo con independencia de su parentesco histórico.
const CONJUNTOS = new Set(['cristianismo', 'islam', 'judaismo', 'hinduismo', 'budismo', 'sijismo',
  'jainismo', 'bahai', 'taoismo', 'sinto', 'confucianismo', 'zoroastrismo']);
const ANCHO_CRONOLOGICO = 1120;

@Component({
  selector: 'app-explorador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explorador.html',
  imports: [Desplazamiento, ReglaTemporal],
})
export class Explorador {
  private superficie = viewChild<ElementRef<HTMLElement>>('superficie');
  readonly controles = viewChild<TemplateRef<unknown>>('controles');
  readonly planoMapa = { ancho: 720, alto: 347 };
  readonly d = inject(Datos);
  readonly estado = inject(Estado);
  readonly i18n = inject(I18n);
  readonly ui = UI;
  readonly vista = this.estado.visualizacion;
  readonly esSuperficieInteractiva = computed(() =>
    ['cronologia', 'linajes', 'grafo', 'mapa', 'arcos', 'matriz', 'paralelas'].some(vista => vista === this.vista()));

  readonly hoy = this.d.marcas[0];
  readonly minimo = this.d.marcas.at(-1)!;
  readonly agrupacion = signal<'territorios' | 'familias'>('territorios');
  readonly zona = signal('');
  readonly zonaArcos = signal('eur');
  readonly rama = signal('');
  readonly foco = signal('');
  readonly profundidadElegida = signal<number | null>(null);
  readonly expandidas = signal<ReadonlySet<string> | null>(null);
  readonly comparadas = signal(['catolica', 'ortodoxa', '']);
  readonly escalaHorizontal = signal(100);
  readonly anchoCronologico = ANCHO_CRONOLOGICO;
  readonly camaraTemporal = signal<CamaraTemporal>({ x: 0, y: 0, escala: 1, ancho: 0, alto: 0 });
  readonly anio = signal(this.hoy);
  readonly hasta = signal(this.hoy);
  readonly periodo = signal(false);
  readonly regionMapa = signal('');
  readonly tipoVinculo = signal('');
  readonly agrupacionMatriz = signal<'territorios' | 'familias' | 'tradiciones'>('territorios');
  readonly origenMatriz = signal('eur');
  readonly destinoMatriz = signal('eur');
  readonly celda = signal<{ a: string; b: string } | null>(null);
  readonly territoriosParalelos = signal(['eur', 'afr', 'opr']);
  readonly intervaloElegido = signal<{ region: string; indice: number } | null>(null);
  readonly grupoDemografico = signal('');
  readonly nivelDemografico = signal<'conjuntos' | 'ramas'>('conjuntos');
  readonly raices = origenes(this.d.relaciones);
  readonly cadenas = new Map(this.d.religiones.map(r => [r.id, ascendencia(r.id, this.raices, this.d.porId)]));
  readonly tiposRelacion = [...new Set(this.d.relaciones.map(r => r.clase))];
  readonly visibles = computed(() => this.d.religiones.filter(r => !this.estado.ocultos().has(r.id)));
  readonly idVisibles = computed(() => new Set(this.visibles().map(r => r.id)));
  readonly alfabeticas = computed(() => [...this.visibles()].sort((a, b) => a.nombre.localeCompare(b.nombre, this.i18n.idioma)));
  readonly relaciones = computed(() => {
    const ids = this.idVisibles(), influencias = this.estado.capaInfluencias();
    return this.d.relaciones.filter(r => ids.has(r.origen) && ids.has(r.destino) && (influencias || r.clase !== 'influencia'));
  });
  readonly enlacesFiltrados = computed(() => this.relaciones().filter(r => !this.tipoVinculo() || r.clase === this.tipoVinculo()));

  constructor() {
    effect(() => {
      this.vista();
      const superficie = this.superficie()?.nativeElement;
      if (superficie) superficie.scrollTop = 0;
    });
  }

  agrupar(elementos: Religion[], por: 'territorios' | 'familias' | 'tradiciones' = this.agrupacion()): Grupo[] {
    const grupos = new Map<string, Grupo>();
    for (const r of [...elementos].sort(POR_FECHA)) {
      const id = this.idGrupo(r, por);
      let g = grupos.get(id);
      if (!g) {
        const region = this.d.region.get(id);
        g = { id, nombre: region?.nombre ?? this.d.porId.get(id)?.nombre ?? id, color: region?.color, elementos: [] };
        grupos.set(id, g);
      }
      g.elementos.push(r);
    }
    return [...grupos.values()].sort((a, b) => por === 'territorios'
      ? this.d.region.get(a.id)!.orden - this.d.region.get(b.id)!.orden
      : a.nombre.localeCompare(b.nombre, this.i18n.idioma));
  }

  private idGrupo(r: Religion, por: 'territorios' | 'familias' | 'tradiciones' = this.agrupacion()) {
    if (por === 'tradiciones') return r.id;
    return por === 'territorios' ? r.region : this.cadenas.get(r.id)![0].id;
  }

  color(r: Religion) { return this.d.region.get(r.region)!.color; }
  elegir(r: Religion) { this.estado.elegir(r); }
  nombreRel(rel: Relacion) {
    return this.d.porId.get(rel.origen)!.nombre + ' → ' + this.d.porId.get(rel.destino)!.nombre + ' · ' + this.i18n.t('r_' + rel.clase);
  }
  abreviar(nombre: string, max = 23) { return nombre.length <= max ? nombre : nombre.slice(0, max - 1) + '…'; }

  // Cronograma general con la misma escala temporal de las vistas originales.
  readonly grupos = computed(() => this.agrupar(this.visibles()));
  readonly densidadTemporal = computed(() => Math.min(1, (this.camaraTemporal().ancho || ANCHO_CRONOLOGICO) / ANCHO_CRONOLOGICO));
  readonly cronologia = computed(() => cronograma(this.grupos().filter(g => !this.zona() || g.id === this.zona()), this.x, this.hoy, this.densidadTemporal()));
  readonly x = (anio: number) => ANCHO_CRONOLOGICO *
    (this.d.yDe(this.minimo) - this.d.yDe(anio)) / (this.d.yDe(this.minimo) - this.d.yDe(this.hoy));

  xPantalla(x: number) {
    const c = this.camaraTemporal();
    return c.x + x * c.escala;
  }
  centroSeleccionable(x: number) {
    return Math.max(8, Math.min(this.camaraTemporal().ancho - 8, x));
  }
  readonly marcas = computed(() => {
    const c = this.camaraTemporal();
    const arcos = this.vista() === 'arcos' ? this.arcos() : null;
    const x = arcos?.x ?? this.x;
    return marcasAdaptativas(this.d.marcas, a => c.x + x(a) * c.escala, arcos?.inicio ?? this.minimo,
      arcos?.fin ?? this.hoy, c.ancho);
  });

  // Árbol jerárquico de las derivaciones principales. Un filtro puede dejar visible únicamente un subárbol.
  readonly ramas = computed(() => {
    const hijos = new Map<string, Religion[]>(), raices: Religion[] = [];
    const ids = this.idVisibles();
    for (const r of [...this.visibles()].sort(POR_FECHA)) {
      const padre = this.raices.get(r.id);
      if (!padre || !ids.has(padre)) { raices.push(r); continue; }
      const lista = hijos.get(padre) ?? [];
      lista.push(r);
      hijos.set(padre, lista);
    }
    return { hijos, raices };
  });
  readonly opcionesRama = computed(() => this.alfabeticas().filter(r => this.ramas().hijos.has(r.id)));
  readonly filasArbol = computed(() => {
    const { hijos, raices } = this.ramas(), expandidas = this.ramasAbiertas();
    const elegida = this.idVisibles().has(this.rama()) ? this.d.porId.get(this.rama()) : undefined;
    const filas: { r: Religion; nivel: number; ramas: number; abierta: boolean }[] = [];
    const recorrer = (r: Religion, nivel: number) => {
      const lista = hijos.get(r.id) ?? [];
      const abierta = expandidas.has(r.id);
      filas.push({ r, nivel, ramas: lista.length, abierta });
      if (abierta) for (const hija of lista) recorrer(hija, nivel + 1);
    };
    for (const r of elegida ? [elegida] : raices) recorrer(r, 0);
    return filas;
  });
  readonly ramasAbiertas = computed(() => {
    const { hijos, raices } = this.ramas();
    return this.expandidas() ?? new Set(raices.flatMap(r => [r, ...(hijos.get(r.id) ?? [])]).map(r => r.id));
  });
  plegar(id: string) {
    const s = new Set(this.ramasAbiertas());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.expandidas.set(s);
  }
  escogerRama(id: string) {
    this.rama.set(id);
    this.expandidas.set(id ? new Set([id]) : null);
  }

  readonly centro = computed(() => this.idVisibles().has(this.foco()) ? this.d.porId.get(this.foco()) : undefined);
  readonly niveles = computed(() => nivelesGrafo(this.centro(), this.visibles(), this.relaciones()));
  readonly profundidadMax = computed(() => Math.max(0, ...Array.from(this.niveles().values(), Math.abs)));
  readonly profundidad = computed(() => Math.min(this.profundidadElegida() ?? this.profundidadMax(), this.profundidadMax()));
  readonly opcionesProfundidad = computed(() => Array.from({length: this.profundidadMax()}, (_, i) => i + 1));
  cambiarFoco(id: string) {
    this.estado.elegir(null);
    this.foco.set(id);
    this.profundidadElegida.set(null);
  }
  readonly grafo = computed(() => dibujarGrafo(this.niveles(), this.relaciones(), this.d.porId, this.profundidad(), this.centro()));
  readonly centroGrafo = computed(() => this.grafo().nodos.find(n => n.r.id === this.centro()?.id));
  readonly focoVisualGrafo = computed(() => this.estado.seleccion() ?? this.centro()?.id);
  readonly resalteGrafo = computed(() => resaltarGrafo(this.focoVisualGrafo(), this.grafo().enlaces.map(e => e.rel)));
  readonly enlacesGrafo = computed(() => {
    const { enlaces } = this.grafo(), resalte = this.resalteGrafo(), foco = this.focoVisualGrafo();
    const prioridad = (r: Relacion) => r.origen === foco || r.destino === foco ? 2 : resalte.ramas.has(r) ? 1 : 0;
    return foco ? [...enlaces].sort((a, b) => prioridad(a.rel) - prioridad(b.rel)) : enlaces;
  });
  caminoGrafo(a: NodoGrafo, b: NodoGrafo) {
    if (a.nivel === b.nivel || a.nivel === Infinity || b.nivel === Infinity) {
      const sx = Math.min(a.x, b.x) - 112;
      return 'M' + a.x + ' ' + a.y + 'C' + sx + ' ' + a.y + ' ' + sx + ' ' + b.y + ' ' + b.x + ' ' + b.y;
    }
    const m = (a.x + b.x) / 2;
    return 'M' + a.x + ' ' + a.y + 'C' + m + ' ' + a.y + ' ' + m + ' ' + b.y + ' ' + b.x + ' ' + b.y;
  }

  cambiarComparada(i: number, id: string) {
    this.comparadas.update(lista => lista.map((r, j) => i === j ? id : r));
  }
  readonly linajes = computed(() => {
    const seleccion = [...new Set(this.comparadas().filter(id => id === '*' || this.idVisibles().has(id)))];
    const conjuntos = seleccion.map(id => id === '*' ? { id, nombre: this.i18n.t('todo'), elementos: this.visibles() } : {
      id, nombre: this.d.porId.get(id)!.nombre,
      elementos: this.cadenas.get(id)!.filter(r => this.idVisibles().has(r.id)),
    });
    const [primero, ...resto] = conjuntos.filter(g => g.id !== '*');
    const comun = resto.length ? [...primero.elementos].reverse().find(r => resto.every(g => g.elementos.some(e => e.id === r.id))) : undefined;
    const ids = new Set(conjuntos.filter(g => g.id !== '*').flatMap(g => g.elementos.map(r => r.id)));
    const cruzadas = this.relaciones().filter(r => !r.principal && ids.has(r.origen) && ids.has(r.destino));
    return { conjuntos, comun, cruzadas };
  });
  readonly graficoLinajes = computed(() => cronograma(this.linajes().conjuntos, this.x, this.hoy, this.densidadTemporal()));

  readonly amplitudTemporal = this.d.yDe(this.minimo) - this.d.yDe(this.hoy);
  readonly posicionAnio = computed(() => Math.round(this.d.yDe(this.minimo) - this.d.yDe(this.anio())));
  desdeDeslizador(posicion: number) {
    const y = this.d.yDe(this.minimo) - posicion;
    let a = this.minimo, b = this.hoy;
    while (a < b) {
      const medio = Math.floor((a + b) / 2);
      if (this.d.yDe(medio) > y) a = medio + 1; else b = medio;
    }
    this.anio.set(this.ajustarAnio(a));
  }
  editarFecha(campo: HTMLInputElement, final = false, confirmar = false) {
    const destino = final ? this.hasta : this.anio;
    const valor = campo.valueAsNumber;
    if (Number.isFinite(valor) && (confirmar || (valor >= this.minimo && valor <= this.hoy))) {
      destino.set(this.ajustarAnio(valor));
    }
    if (confirmar) campo.value = String(destino());
  }
  private ajustarAnio(valor: number) {
    const a = Math.max(this.minimo, Math.min(this.hoy, Math.round(Number.isFinite(valor) ? valor : this.anio())));
    return a === 0 ? 1 : a;
  }
  readonly fechasCorte = computed(() => {
    const a = this.anio(), b = this.periodo() && this.vista() === 'corte' ? this.hasta() : a;
    return [Math.min(a, b), Math.max(a, b)] as const;
  });
  readonly coincidencias = computed(() => {
    const [inicio, fin] = this.fechasCorte();
    return this.visibles().filter(r => r.inicio <= fin && (r.fin ?? this.hoy) >= inicio);
  });
  readonly corte = computed(() => this.agrupar(this.coincidencias()));
  readonly mapa = computed(() => {
    const grupos = new Map(this.agrupar(this.coincidencias(), 'territorios').map(g => [g.id, g.elementos]));
    return this.d.regiones.map(r => {
      const [lon, lat, dx, dy] = MARCADORES[r.id];
      return { r, x: (lon + 180) * 2, y: (83 - lat) * 2, dx, dy, elementos: grupos.get(r.id) ?? [], radio: 9 + Math.min(10, Math.sqrt(grupos.get(r.id)?.length ?? 0)) };
    });
  });
  readonly listaMapa = computed(() => this.mapa().find(p => p.r.id === this.regionMapa()));

  cambiarZona(id: string) {
    (this.vista() === 'arcos' ? this.zonaArcos : this.zona).set(id);
  }
  readonly arcos = computed(() => {
    const region = this.zonaArcos();
    const nodos = this.visibles().filter(r => !region || r.region === region).sort(POR_FECHA);
    if (!nodos.length) return null;
    const ids = new Set(nodos.map(r => r.id));
    const fin = nodos.at(-1)!.inicio;
    const inicio = Math.min(nodos[0].inicio, fin - 1);
    const x = (a: number) => 1100 * (this.d.yDe(inicio) - this.d.yDe(a)) / Math.max(.01, this.d.yDe(inicio) - this.d.yDe(fin));
    const porFechas = new Map<string, { a: number; b: number; rel: Relacion }[]>();
    for (const rel of this.enlacesFiltrados()) {
      if (!ids.has(rel.origen) || !ids.has(rel.destino)) continue;
      const a = x(this.d.porId.get(rel.origen)!.inicio), b = x(this.d.porId.get(rel.destino)!.inicio);
      const clave = Math.min(a, b) + ':' + Math.max(a, b);
      const grupo = porFechas.get(clave) ?? [];
      grupo.push({ a, b, rel });
      porFechas.set(clave, grupo);
    }
    const enlaces = [...porFechas.values()].flatMap(grupo => {
      const separacion = Math.min(10, 58 / Math.max(1, grupo.length - 1));
      return grupo.map((e, i) => ({ ...e, separacion: (i - (grupo.length - 1) / 2) * separacion }));
    });
    const ocupados: number[] = [];
    const puntos = nodos.map(r => {
      const px = x(r.inicio);
      let fila = ocupados.findIndex(ultimo => px - ultimo > 13);
      if (fila < 0) fila = ocupados.length;
      ocupados[fila] = px;
      return { r, x: px, y: 246 + fila * 15 };
    });
    return { enlaces, puntos, inicio, fin, x, alto: 265 + ocupados.length * 15 };
  });

  readonly seleccionArcos = computed(() => {
    const g = this.arcos();
    const id = this.estado.seleccion(), enlace = this.estado.relacion();
    return {
      nodo: id && g?.puntos.some(p => p.r.id === id) ? id : undefined,
      enlace: enlace && g?.enlaces.some(e => e.rel === enlace) ? enlace : undefined,
    };
  });
  readonly resalteArcos = computed(() => {
    const { nodo, enlace } = this.seleccionArcos();
    return resaltarGrafo(nodo, this.relaciones(), enlace);
  });
  arcoDirecto(rel: Relacion) {
    const { nodo, enlace } = this.seleccionArcos();
    return rel === enlace || rel.origen === nodo || rel.destino === nodo;
  }
  readonly enlacesArcos = computed(() => {
    const enlaces = this.arcos()?.enlaces ?? [];
    const resalte = this.resalteArcos();
    const nivel = (r: Relacion) => this.arcoDirecto(r) ? 2 : resalte.ramas.has(r) ? 1 : 0;
    return resalte.nodos.size ? [...enlaces].sort((a, b) => nivel(a.rel) - nivel(b.rel)) : enlaces;
  });

  arcoD(a: number, b: number, separacion: number) {
    const distancia = Math.abs(a - b);
    const h = Math.max(12, Math.min(185, 29 + 130 * (1 - Math.exp(-distancia / 530)) + separacion));
    const ancho = 23 + separacion * .3;
    const forma = a === b ? 'C' + (a - ancho) + ' ' + (206 - h) + ' ' + (a + ancho) + ' ' + (206 - h)
      : 'Q' + ((a + b) / 2) + ' ' + (206 - h * 2);
    return 'M' + a + ' 206' + forma + ' ' + b + ' 206';
  }

  readonly matriz = computed(() => {
    const por = this.agrupacionMatriz();
    const visibles = this.visibles();
    const elementos = this.agrupar(por === 'tradiciones' ? visibles.filter(r => r.region === this.origenMatriz()) : visibles, por);
    const destinos = por === 'tradiciones' ? this.agrupar(visibles.filter(r => r.region === this.destinoMatriz()), por) : elementos;
    const filas = new Set(elementos.map(g => g.id)), columnas = new Set(destinos.map(g => g.id));
    const celdas = new Map<string, Relacion[]>();
    for (const rel of this.enlacesFiltrados()) {
      const a = this.idGrupo(this.d.porId.get(rel.origen)!, por);
      const b = this.idGrupo(this.d.porId.get(rel.destino)!, por);
      if (!filas.has(a) || !columnas.has(b)) continue;
      const clave = a + ':' + b, lista = celdas.get(clave) ?? [];
      lista.push(rel);
      celdas.set(clave, lista);
    }
    return { filas: elementos, columnas: destinos, celdas, max: Math.max(1, ...[...celdas.values()].map(l => l.length)) };
  });
  readonly vinculosCelda = computed(() => {
    const c = this.celda();
    return c ? this.matriz().celdas.get(c.a + ':' + c.b) ?? [] : [];
  });
  opacidad(n: number, max: number) { return .21 + .79 * Math.log1p(n) / Math.log1p(max); }

  cambiarParalela(i: number, id: string) {
    this.territoriosParalelos.update(lista => lista.map((r, j) => i === j ? id : r));
    this.intervaloElegido.set(null);
  }
  readonly intervalos = [this.minimo, -50000, -10000, -3000, -1000, 1, 500, 1000, 1500, 1750, 1900, 1950, 2000, this.hoy];
  readonly paralelas = computed(() => {
    const visibles = this.visibles();
    const regiones = [...new Set(this.territoriosParalelos().filter(Boolean))].map(id => this.d.region.get(id)!);
    const grupos = regiones.map(r => ({
      r, tramos: this.intervalos.slice(0, -1).map((a, i) => {
        const b = this.intervalos[i + 1], ultimo = i === this.intervalos.length - 2;
        const elementos = visibles.filter(e => e.region === r.id && e.inicio >= a && (ultimo ? e.inicio <= b : e.inicio < b));
        return { a, b, elementos };
      }),
    }));
    return { grupos, max: Math.max(1, ...grupos.flatMap(g => g.tramos.map(t => t.elementos.length))) };
  });
  readonly intervaloActivo = computed(() => {
    const x = this.intervaloElegido();
    return x ? this.paralelas().grupos.find(g => g.r.id === x.region)?.tramos[x.indice] : undefined;
  });

  readonly familiasDemograficas = computed(() => this.alfabeticas().filter(r => CONJUNTOS.has(r.id) && r.fieles !== null));
  readonly demografia = computed(() => {
    const conjuntos = this.nivelDemografico() === 'conjuntos', grupo = this.grupoDemografico();
    const elementos = this.visibles().filter(r => r.fieles !== null && (conjuntos ? CONJUNTOS.has(r.id)
      : !CONJUNTOS.has(r.id) && (!grupo || this.cadenas.get(r.id)!.slice(0, -1).some(a => a.id === grupo))));
    elementos.sort((a, b) => b.fieles! - a.fieles!);
    return { elementos, max: Math.max(1, ...elementos.map(r => r.fielesMax ?? r.fieles!)) };
  });
}
