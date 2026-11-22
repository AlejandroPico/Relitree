import { Injectable, inject, signal } from '@angular/core';
import { version } from '../../package.json';
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
export interface Trazado {
  ancho: number; regiones: Region[]; religiones: Religion[]; porId: ReadonlyMap<string, Religion>;
}
export interface Relacion { origen: string; destino: string; clase: string; principal: boolean; }
export interface EditorialArticulo {
  estado: 'borrador' | 'completo';
  fase: string | null;
  palabras: number;
  fuentes: string[];
  ficha: Record<string, string>;
}
export interface Articulo {
  id: string; grupo: string; padre: string | null; titulo: string; html?: string;
  orden?: number | null; destino_indice?: string | null; editorial?: EditorialArticulo;
}
export interface CoincidenciaArticulo {
  id: string; titulo: string; seccion: string; titulo_seccion: string; fragmento: string;
}

/** Acceso a la base SQLite generada por el backend de Python (se consulta en el navegador con WebAssembly). */
@Injectable({ providedIn: 'root' })
export class Datos {
  private i18n = inject(I18n);
  readonly listo = signal(false);
  readonly error = signal<string | null>(null);
  private bd: any;
  private tieneTexto = false;
  private tieneEditorial = false;
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
  private compacto: Trazado | null = null;
  private tramos: [number, number, number][] = [];
  marcas: number[] = [];
  private mayorEscala = 0;

  async cargar(): Promise<void> {
    try {
      const [SQL, buf] = await Promise.all([
        initSqlJs({ locateFile: (f) => `sqljs/${f}` }),
        fetch(`datos/relitree.sqlite?v=${encodeURIComponent(version)}`, { cache: 'reload' }).then((r) => { if (!r.ok) throw new Error('relitree.sqlite'); return r.arrayBuffer(); }),
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
      this.mayorEscala = Math.max(0, ...this.tramos.map(([, , escala]) => escala));
      const filasRegiones = this.filas('SELECT * FROM regiones ORDER BY orden');
      this.regiones = filasRegiones.map((r) => ({ ...r, nombre: nombres.get('region:' + r.id) ?? r.id }));
      this.regiones.forEach((r) => this.region.set(r.id, r));
      for (const t of this.filas('SELECT id FROM tipos ORDER BY orden')) this.tipos.set(t.id, nombres.get('tipo:' + t.id) ?? t.id);
      const filasReligiones = this.filas('SELECT * FROM religiones ORDER BY importancia, inicio');
      this.religiones = filasReligiones.map((f) => {
        const t = textos.get(f.id) ?? { nombre: f.id, resumen: '' };
        return {
          ...f, nombre: t.nombre, resumen: t.resumen, yFin: f.y_fin, heredado: !!f.icono_heredado,
          credito: f.icono_credito && !f.icono_heredado ? JSON.parse(f.icono_credito) : null,
          fielesFuente: f.fieles_fuente, fielesMax: f.fieles_max, lineas: partir(t.nombre), r: 13 + f.importancia * 3.2,
        };
      });
      this.religiones.forEach((r) => this.porId.set(r.id, r));
      if (this.meta['ancho_compacto']) {
        const regiones = this.regiones.map((r, i) => ({
          ...r, x: filasRegiones[i].x_compacto, ancho: filasRegiones[i].ancho_compacto,
        }));
        const religiones = this.religiones.map((r, i) => ({
          ...r, x: filasReligiones[i].x_compacto, yFin: filasReligiones[i].y_fin_compacto,
        }));
        this.compacto = {
          ancho: +this.meta['ancho_compacto'], regiones, religiones, porId: new Map(religiones.map((r) => [r.id, r])),
        };
      }
      this.relaciones = this.filas('SELECT * FROM relaciones').map((f: any) => ({ ...f, principal: !!f.principal }));
      const indice = new Map<string, Articulo>();
      const columnas = this.filas('PRAGMA table_info(articulos)').map((columna) => columna.name);
      this.tieneEditorial = columnas.includes('editorial');
      this.tieneTexto = this.filas("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'articulos_texto'").length > 0;
      const camposOpcionales = ['orden', 'destino_indice', 'editorial'].filter((campo) => columnas.includes(campo));
      const campos = ['id', 'grupo', 'padre', 'titulo', ...camposOpcionales].join(', ');
      for (const a of capas(`SELECT ${campos} FROM articulos WHERE idioma = ?`)) {
        indice.set(a.id, { ...a, editorial: a.editorial ? JSON.parse(a.editorial) : undefined });
      }
      this.indice = [...indice.values()].sort((a, b) =>
        (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER) ||
        a.titulo.localeCompare(b.titulo, this.idioma));
      this.listo.set(true);
    } catch (e: any) {
      this.error.set(String(e?.message ?? e));
    }
  }

  get tieneTrazadoCompacto(): boolean { return this.compacto !== null; }
  trazado(vidasCompletas: boolean): Trazado { return !vidasCompletas && this.compacto ? this.compacto : this; }

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
  destinoArticulo(id: string): string {
    return this.indice.find((entrada) => entrada.id === id)?.destino_indice ?? id;
  }
  articulo(id: string): Articulo | null {
    id = this.destinoArticulo(id);
    const editorial = this.tieneEditorial ? ', editorial' : '';
    const sql = 'SELECT id, grupo, padre, titulo, html' + editorial + ' FROM articulos WHERE id = ? AND idioma = ?';
    const fila = this.filas(sql, [id, this.idioma])[0] ?? this.filas(sql, [id, this.base])[0];
    return fila ? { ...fila, editorial: fila.editorial ? JSON.parse(fila.editorial) : undefined } : null;
  }

  buscarArticulos(consulta: string, limite: number): CoincidenciaArticulo[] {
    const texto = normalizar(consulta.trim().replace(/\s+/g, ' '));
    if (!texto || !this.tieneTexto) return [];

    return this.filas(`
      WITH coincidencias AS (
        SELECT a.id, a.titulo, t.seccion, t.titulo_seccion, t.texto, t.orden,
          instr(t.normalizado, ?1) AS posicion, instr(a.busqueda, ?1) AS ini_titulo
        FROM articulos_texto t JOIN articulos a ON a.id = t.id AND a.idioma = t.idioma
        WHERE (t.idioma = ?2 OR (t.idioma = ?3 AND NOT EXISTS (
          SELECT 1 FROM articulos propia WHERE propia.id = t.id AND propia.idioma = ?2
        ))) AND (posicion > 0 OR ini_titulo > 0)
      ), ordenadas AS (
        SELECT *, row_number() OVER (PARTITION BY id ORDER BY
          CASE WHEN posicion = 0 THEN 2 WHEN posicion <= length(titulo_seccion) THEN 0 ELSE 1 END,
          orden
        ) AS numero,
          max(1, posicion - 64) AS inicio, max(170, length(?1) + 100) AS longitud
        FROM coincidencias
      )
      SELECT id, titulo, CASE WHEN posicion > 0 THEN seccion ELSE '' END AS seccion,
        CASE WHEN posicion > 0 THEN titulo_seccion ELSE '' END AS titulo_seccion,
        CASE WHEN inicio > 1 THEN '…' ELSE '' END || trim(substr(texto, inicio, longitud)) ||
        CASE WHEN length(texto) >= inicio + longitud THEN '…' ELSE '' END AS fragmento
      FROM ordenadas WHERE numero = 1
      ORDER BY (ini_titulo = 0), (ini_titulo <> 1), titulo, id LIMIT ?4
    `, [texto, this.idioma, this.base, limite]);
  }
  padres(id: string) { return this.relaciones.filter((r) => r.destino === id && r.clase !== 'influencia'); }
  hijas(id: string) { return this.relaciones.filter((r) => r.origen === id && r.clase !== 'influencia'); }
  influenciasDe(id: string) { return this.relaciones.filter((r) => r.destino === id && r.clase === 'influencia'); }
  influyeEn(id: string) { return this.relaciones.filter((r) => r.origen === id && r.clase === 'influencia'); }

  /** Marcas equidistantes en el dibujo. La fecha se obtiene invirtiendo la escala por tramos. */
  marcasUniformes(separacion: number): { y: number; anio: number; aproximada: boolean }[] {
    const y0 = this.yDe(this.marcas[0]);
    const fin = this.yDe(this.marcas[this.marcas.length - 1]);
    const paso = Math.max(separacion, this.mayorEscala);
    const marcas: { y: number; anio: number; aproximada: boolean }[] = [];
    for (let i = 0, tramo = 0, inicio = y0; y0 + i * paso <= fin; i++) {
      const y = y0 + i * paso;
      while (tramo < this.tramos.length - 1) {
        const [desde, hasta, escala] = this.tramos[tramo];
        const limite = inicio + (desde - hasta) * escala;
        if (y <= limite) break;
        inicio = limite;
        tramo++;
      }
      const [desde, , escala] = this.tramos[tramo];
      const fecha = desde - (y - inicio) / escala;
      const anio = Math.round(fecha);
      marcas.push({ y, anio, aproximada: Math.abs(anio - fecha) > .001 });
    }
    return marcas;
  }

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
  return t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
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
