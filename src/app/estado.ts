import { Injectable, computed, inject, signal } from '@angular/core';
import { Datos, Relacion, Religion } from './datos';

export interface Vista { k: number; tx: number; ty: number; w: number; h: number; }

/** Estado compartido de la interfaz: selección, filtros, capas y vista del lienzo. */
@Injectable({ providedIn: 'root' })
export class Estado {
  private datos = inject(Datos);
  readonly seleccion = signal<string | null>(null);
  readonly relacion = signal<Relacion | null>(null);
  readonly vista = signal<Vista>({ k: 1, tx: 0, ty: 0, w: 0, h: 0 });
  readonly irA = signal<{ id: string; n: number } | null>(null);
  readonly enciclopedia = signal<string | null>(null);      // id del artículo abierto
  readonly radial = signal(false);                          // presentación radial en lugar de columnas

  readonly regionesOff = signal<Set<string>>(new Set());
  readonly tiposOff = signal<Set<string>>(new Set());
  readonly impMin = signal(1);
  readonly capaInfluencias = signal(true);
  readonly capaExtintas = signal(true);
  readonly capaRejilla = signal(true);
  readonly vidasCompletas = signal(true);
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
