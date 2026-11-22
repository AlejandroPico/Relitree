import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Datos, Relacion, Religion } from './datos';

import { Visualizacion } from './vistas';

interface VisitaEnciclopedia {
  id: string;
  titulo: string;
  profundidad: number;
  clave: string;
}

function visitaDe(estado: unknown): VisitaEnciclopedia | null {
  if (!estado || typeof estado !== 'object' || !('relitreeArticulo' in estado)) return null;
  const visita = estado.relitreeArticulo as Partial<VisitaEnciclopedia> | null;
  return typeof visita?.id === 'string' && typeof visita.titulo === 'string'
    && typeof visita.clave === 'string' && typeof visita.profundidad === 'number'
    && Number.isSafeInteger(visita.profundidad) && visita.profundidad > 0 ? visita as VisitaEnciclopedia : null;
}

export interface Vista { k: number; tx: number; ty: number; w: number; h: number; }

/** Estado compartido de la interfaz: selección, filtros, capas y vista del lienzo. */
@Injectable({ providedIn: 'root' })
export class Estado {
  private datos = inject(Datos);
  readonly seleccion = signal<string | null>(null);
  readonly relacion = signal<Relacion | null>(null);
  readonly vista = signal<Vista>({ k: 1, tx: 0, ty: 0, w: 0, h: 0 });
  readonly irA = signal<{ id: string; n: number } | null>(null);
  private readonly visitaActiva = signal(visitaDe(history.state));
  readonly visitaEnciclopedia = this.visitaActiva.asReadonly();
  readonly enciclopedia = computed(() => this.visitaActiva()?.id ?? null);
  readonly posicionesEnciclopedia = new Map<string, number>();
  readonly visualizacion = signal<Visualizacion>('columnas');
  readonly radial = computed(() => this.visualizacion() === 'radial');
  readonly esLienzo = computed(() => this.visualizacion() === 'columnas' || this.radial());

  readonly regionesOff = signal<Set<string>>(new Set());
  readonly tiposOff = signal<Set<string>>(new Set());
  readonly impMin = signal(1);
  readonly capaInfluencias = signal(true);
  readonly capaExtintas = signal(true);
  readonly capaRejilla = signal(true);
  readonly capaPuentes = signal(true);
  private readonly pasoVertical = computed(() => 48 / this.vista().k);
  readonly marcasTiempo = computed(() => this.datos.marcasUniformes(this.pasoVertical()));
  readonly vidasCompletas = signal(false);
  readonly trazado = computed(() => this.datos.trazado(this.vidasCompletas()));

  readonly ocultos = computed(() => {
    const reg = this.regionesOff(), tip = this.tiposOff(), imp = this.impMin(), ext = this.capaExtintas();
    const s = new Set<string>();
    for (const r of this.datos.religiones)
      if (reg.has(r.region) || tip.has(r.tipo) || r.importancia < imp || (!ext && r.fin !== null)) s.add(r.id);
    return s;
  });

  /** Tradiciones emparentadas con la selección: todo el linaje ascendente, todo el árbol que desciende de ella e influencias directas. */
  readonly foco = computed<Set<string> | null>(() => {
    const rel = this.relacion();
    if (rel) return new Set([rel.origen, rel.destino]);
    const id = this.seleccion();
    if (!id) return null;
    const s = new Set<string>([id]);
    let actual: string | undefined = id;
    while (actual) {
      const p: Relacion | undefined = this.datos.relaciones.find((r) => r.destino === actual && r.principal);
      actual = p?.origen;
      if (actual) s.add(actual);
    }
    const cola = [id];
    while (cola.length) {
      const x = cola.pop()!;
      for (const r of this.datos.relaciones)
        if (r.origen === x && r.clase !== 'influencia' && !s.has(r.destino)) { s.add(r.destino); cola.push(r.destino); }
    }
    for (const r of this.datos.relaciones) {
      if (r.origen === id) s.add(r.destino);
      if (r.destino === id) s.add(r.origen);
    }
    return s;
  });

  constructor() {
    const volver = (evento: PopStateEvent) => this.visitaActiva.set(visitaDe(evento.state));
    window.addEventListener('popstate', volver);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('popstate', volver));
  }

  abrirArticulo(id: string, titulo = '') {
    id = this.datos.destinoArticulo(id);
    const anterior = this.visitaActiva();
    if (id === anterior?.id) return;
    const visita = {
      id, titulo, profundidad: (anterior?.profundidad ?? 0) + 1,
      clave: crypto.randomUUID(),
    };
    history.pushState({ ...history.state, relitreeArticulo: visita }, '');
    this.visitaActiva.set(visita);
  }

  volverArticulo() {
    if (this.visitaActiva()) history.back();
  }

  cerrarEnciclopedia() {
    const visita = this.visitaActiva();
    if (visita) history.go(-visita.profundidad);
  }

  elegir(r: Religion | string | null, volar = false): void {
    const id = typeof r === 'string' ? r : r?.id ?? null;
    this.relacion.set(null);
    this.seleccion.set(id);
    if (id && volar) this.irA.set({ id, n: Date.now() });
  }
  elegirRelacion(r: Relacion): void { this.seleccion.set(null); this.relacion.set(r); }
  alternar(conj: typeof this.regionesOff, id: string): void {
    const s = new Set(conj()); s.has(id) ? s.delete(id) : s.add(id); conj.set(s);
  }
}
