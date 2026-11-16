import { Injectable, inject, signal } from '@angular/core';
import { I18n } from './i18n';

declare const initSqlJs: (cfg: { locateFile: (f: string) => string }) => Promise<any>;

export interface Region { id: string; orden: number; nombre: string; color: string; x: number; ancho: number; }
export interface Religion {
  id: string; nombre: string; region: string; inicio: number; fin: number | null; tipo: string;
  importancia: number; resumen: string; x: number; y: number; yFin: number;
  icono: string | null; credito: { fuente?: string; licencia?: string; autor?: string; motivo?: string } | null; heredado: boolean;
  fieles: number | null; fielesMax: number | null; fielesFuente: string | null;
  lineas: string[]; r: number;
}
export interface Relacion { origen: string; destino: string; clase: string; principal: boolean; }
export interface Articulo { id: string; grupo: string; padre: string | null; titulo: string; html?: string; }

/** Acceso a la base SQLite generada por el backend de Python (se consulta en el navegador con WebAssembly). */
@Injectable({ providedIn: 'root' })
export class Datos {
  private i18n = inject(I18n);
  readonly listo = signal(false);
  readonly error = signal<string | null>(null);
  private bd: any;
  private base = 'es'; private idioma = 'es';
  meta: Record<string, string> = {};
  regiones: Region[] = [];
  tipos = new Map<string, string>();
  religiones: Religion[] = [];
  porId = new Map<string, Religion>();
  region = new Map<string, Region>();
  relaciones: Relacion[] = [];
  indice: Articulo[] = [];
  ancho = 0; alto = 0;
  private tramos: [number, number, number][] = [];
  marcas: number[] = [];

  async cargar(): Promise<void> {
    try {
      const [SQL, buf] = await Promise.all([
        initSqlJs({ locateFile: (f) => `sqljs/${f}` }),
        fetch('datos/relitree.sqlite').then((r) => { if (!r.ok) throw new Error('relitree.sqlite'); return r.arrayBuffer(); }),
      ]);
      this.bd = new SQL.Database(new Uint8Array(buf));
      for (const m of this.filas('SELECT clave, valor FROM metadatos')) this.meta[m.clave] = m.valor;
      this.base = this.meta['idioma_base'];
      this.idioma = this.i18n.elegir(this.filas('SELECT id FROM idiomas').map((f) => f.id), this.base);
      // Todo texto se lee primero en el idioma base y después se superpone el idioma del usuario.
      const capas = (sql: string) => [...this.filas(sql, [this.base]), ...(this.idioma === this.base ? [] : this.filas(sql, [this.idioma]))];
      const interfaz: Record<string, string> = {};
      for (const f of capas('SELECT clave, texto FROM interfaz WHERE idioma = ?')) interfaz[f.clave] = f.texto;
      this.i18n.cargar(interfaz);
      const nombres = new Map<string, string>();
      for (const f of capas('SELECT clase, id, nombre FROM nombres WHERE idioma = ?')) nombres.set(f.clase + ':' + f.id, f.nombre);
      const textos = new Map<string, { nombre: string; resumen: string }>();
      for (const f of capas('SELECT id, nombre, resumen FROM textos WHERE idioma = ?')) textos.set(f.id, f);

      this.ancho = +this.meta['ancho']; this.alto = +this.meta['alto'];
      this.tramos = JSON.parse(this.meta['tramos']); this.marcas = JSON.parse(this.meta['marcas']);
      this.regiones = this.filas('SELECT * FROM regiones ORDER BY orden').map((r) => ({ ...r, nombre: nombres.get('region:' + r.id) ?? r.id }));
      this.regiones.forEach((r) => this.region.set(r.id, r));
      for (const t of this.filas('SELECT id FROM tipos ORDER BY orden')) this.tipos.set(t.id, nombres.get('tipo:' + t.id) ?? t.id);
      this.religiones = this.filas('SELECT * FROM religiones ORDER BY importancia, inicio').map((f: any) => {
        const t = textos.get(f.id) ?? { nombre: f.id, resumen: '' };
        return {
          ...f, nombre: t.nombre, resumen: t.resumen, yFin: f.y_fin, heredado: !!f.icono_heredado,
          credito: f.icono_credito && !f.icono_heredado ? JSON.parse(f.icono_credito) : null,
          fielesFuente: f.fieles_fuente, fielesMax: f.fieles_max, lineas: partir(t.nombre), r: 13 + f.importancia * 3.2,
        };
      });
      this.religiones.forEach((r) => this.porId.set(r.id, r));
      this.relaciones = this.filas('SELECT * FROM relaciones').map((f: any) => ({ ...f, principal: !!f.principal }));
      const indice = new Map<string, Articulo>();
      for (const a of capas('SELECT id, grupo, padre, titulo FROM articulos WHERE idioma = ?')) indice.set(a.id, a);
      this.indice = [...indice.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, this.idioma));
      this.listo.set(true);
    } catch (e: any) {
      this.error.set(String(e?.message ?? e));
    }
  }

  private filas(sql: string, params: any[] = []): any[] {
    const st = this.bd.prepare(sql); st.bind(params);
    const out: any[] = [];
    while (st.step()) out.push(st.getAsObject());
    st.free();
    return out;
  }

  buscar(texto: string, limite = 12): Religion[] {
    const q = normalizar(texto.trim());
    if (!q) return [];
    return this.filas(
      'SELECT DISTINCT id FROM textos WHERE idioma IN (?, ?) AND busqueda LIKE ? ORDER BY (busqueda LIKE ?) DESC, nombre LIMIT ?',
      [this.idioma, this.base, `%${q}%`, `${q}%`, limite * 2]).map((f) => this.porId.get(f.id)!).filter(Boolean)
      .sort((a, b) => b.importancia - a.importancia).slice(0, limite);
  }
  articulo(id: string): Articulo | null {
    const sql = 'SELECT id, grupo, padre, titulo, html FROM articulos WHERE id = ? AND idioma = ?';
    return this.filas(sql, [id, this.idioma])[0] ?? this.filas(sql, [id, this.base])[0] ?? null;
  }
  padres(id: string) { return this.relaciones.filter((r) => r.destino === id && r.clase !== 'influencia'); }
  hijas(id: string) { return this.relaciones.filter((r) => r.origen === id && r.clase !== 'influencia'); }
  influenciasDe(id: string) { return this.relaciones.filter((r) => r.destino === id && r.clase === 'influencia'); }
  influyeEn(id: string) { return this.relaciones.filter((r) => r.origen === id && r.clase === 'influencia'); }

  /** Año → coordenada vertical del lienzo (misma escala por tramos que el backend). */
  yDe(anio: number): number {
    let y = +this.meta['margen_superior'];
    for (const [desde, hasta, ppa] of this.tramos) {
      if (anio >= hasta) return y + (desde - anio) * ppa;
      y += (desde - hasta) * ppa;
    }
    return y;
  }
}

export function normalizar(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Parte un nombre en un máximo de tres líneas para la etiqueta del nodo. */
function partir(nombre: string, max = 17): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of nombre.split(' ')) {
    if (actual && (actual + ' ' + palabra).length > max) { lineas.push(actual); actual = palabra; }
    else actual = actual ? actual + ' ' + palabra : palabra;
  }
  if (actual) lineas.push(actual);
  if (lineas.length > 3) { lineas[2] = lineas.slice(2).join(' '); lineas.length = 3; }
  return lineas;
}
