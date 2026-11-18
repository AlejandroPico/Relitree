import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Datos, Relacion, Religion } from './datos';
import { Estado } from './estado';
import { I18n } from './i18n';
import { UI } from './glifos';
import { Grupo, NodoGrafo, POR_FECHA, ascendencia, cronograma, grafoLocal, marcasEje, origenes } from './analisis';

const MARCADORES: Record<string, [number, number, number, number]> = {
  afr: [19, 2, 0, 21], eur: [12, 51, -10, -20], opr: [41, 33, -8, 22],
  asn: [82, 57, 0, -20], asm: [77, 22, 9, 21], aso: [117, 36, 9, -17],
  sea: [105, 2, 7, 21], oce: [148, -25, 0, 23], nam: [-105, 46, 0, -21],
  mes: [-90, 16, 0, -18], sam: [-60, -16, 0, 23],
};

// Entradas generales del catálogo con independencia de su parentesco histórico.
const CONJUNTOS = new Set(['cristianismo', 'islam', 'judaismo', 'hinduismo', 'budismo', 'sijismo',
  'jainismo', 'bahai', 'taoismo', 'sinto', 'confucianismo', 'zoroastrismo']);
const X0 = 140;
const X1 = 1050;

@Component({
  selector: 'app-explorador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explorador.html',
})
export class Explorador {
  private superficie = viewChild<ElementRef<HTMLElement>>('superficie');
  private marcoGrafo = viewChild<ElementRef<HTMLElement>>('marcoGrafo');
  readonly d = inject(Datos);
  readonly estado = inject(Estado);
  readonly i18n = inject(I18n);
  readonly ui = UI;
  readonly vista = this.estado.visualizacion;
  readonly hoy = this.d.marcas[0];
  readonly minimo = this.d.marcas.at(-1)!;
  readonly agrupacion = signal<'territorios' | 'familias'>('territorios');
  readonly zona = signal('');
  readonly zonaArcos = signal('eur');
  readonly rama = signal('');
  readonly foco = signal(this.d.porId.has('cristianismo') ? 'cristianismo' : this.d.religiones.at(-1)!.id);
  readonly profundidad = signal(1);
  readonly expandidas = signal<ReadonlySet<string> | null>(null);
  readonly comparadas = signal(['catolica', 'ortodoxa', '']);
  readonly escalaHorizontal = signal(100);
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
    effect((limpiar) => {
      const marco = this.marcoGrafo()?.nativeElement;
      if (!marco || !this.grafo()) return;
      const tarea = requestAnimationFrame(() => {
        const centro = marco.querySelector('.vis-nodo-grafo.actual');
        if (!centro) return;
        const m = marco.getBoundingClientRect(), c = centro.getBoundingClientRect();
        const alto = Math.min(m.height, window.innerHeight - m.top);
        marco.scrollBy(c.left + (c.width - m.width) / 2 - m.left, c.top + (c.height - alto) / 2 - m.top);
      });
      limpiar(() => cancelAnimationFrame(tarea));
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
  readonly cronologia = computed(() => cronograma(this.grupos().filter(g => !this.zona() || g.id === this.zona()), this.x, this.hoy));
  readonly marcas = computed(() => marcasEje(this.d, this.x, this.minimo, this.hoy));
  readonly x = (anio: number) => X0 + (X1 - X0) *
    (this.d.yDe(this.minimo) - this.d.yDe(anio)) / (this.d.yDe(this.minimo) - this.d.yDe(this.hoy));

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

  readonly centro = computed(() => {
    const actual = this.foco();
    return this.idVisibles().has(actual) ? this.d.porId.get(actual) : this.alfabeticas()[0];
  });
  readonly grafo = computed(() => {
    const r = this.centro();
    return r ? grafoLocal(r, this.relaciones(), this.d.porId, this.profundidad()) : null;
  });
  caminoGrafo(a: NodoGrafo, b: NodoGrafo) {
    if (a.nivel === b.nivel || a.nivel === 100 || b.nivel === 100) {
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
    const seleccion = [...new Set(this.comparadas().filter(id => this.idVisibles().has(id)))];
    const conjuntos = seleccion.map(id => ({
      id, nombre: this.d.porId.get(id)!.nombre,
      elementos: this.cadenas.get(id)!.filter(r => this.idVisibles().has(r.id)),
    }));
    const [primero, ...resto] = conjuntos;
    const comun = resto.length ? [...primero.elementos].reverse().find(r => resto.every(g => g.elementos.some(e => e.id === r.id))) : undefined;
    const ids = new Set(conjuntos.flatMap(g => g.elementos.map(r => r.id)));
    const cruzadas = this.relaciones().filter(r => !r.principal && ids.has(r.origen) && ids.has(r.destino));
    return { conjuntos, comun, cruzadas };
  });
  readonly graficoLinajes = computed(() => cronograma(this.linajes().conjuntos, this.x, this.hoy));

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
    const inicio = nodos[0].inicio, fin = Math.min(this.hoy, Math.max(inicio + 1, nodos.at(-1)!.inicio));
    const x = (a: number) => 54 + 992 * (this.d.yDe(inicio) - this.d.yDe(a)) / Math.max(1, this.d.yDe(inicio) - this.d.yDe(fin));
    const enlaces = this.enlacesFiltrados().filter(r => ids.has(r.origen) && ids.has(r.destino)).map(rel => {
      const a = x(this.d.porId.get(rel.origen)!.inicio), b = x(this.d.porId.get(rel.destino)!.inicio);
      const h = Math.min(176, 24 + Math.abs(a - b) * .21);
      const forma = a === b ? 'C' + (a - 22) + ' ' + (206 - h) + ' ' + (a + 22) + ' ' + (206 - h)
        : 'Q' + ((a + b) / 2) + ' ' + (206 - h * 2);
      return { d: 'M' + a + ' 206' + forma + ' ' + b + ' 206', rel };
    });
    const ocupados: number[] = [];
    const puntos = nodos.map(r => {
      const px = x(r.inicio);
      let fila = ocupados.findIndex(ultimo => px - ultimo > 13);
      if (fila < 0) fila = ocupados.length;
      ocupados[fila] = px;
      return { r, x: px, y: 246 + fila * 15 };
    });
    return { enlaces, puntos, marcas: marcasEje(this.d, x, inicio, fin).map(a => ({ a, x: x(a) })), alto: 265 + ocupados.length * 15 };
  });

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
