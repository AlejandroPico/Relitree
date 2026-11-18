import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, viewChild } from '@angular/core';
import { Datos, Relacion, Religion, Trazado } from './datos';
import { Estado } from './estado';
import { I18n } from './i18n';
import { GLIFOS } from './glifos';

// Un valor desconocido conserva el trazo mínimo. La escala comprime los órdenes de magnitud.
export function grosorPorFieles(fieles: number | null): number {
  return 1.4 + 1.7 * Math.log10(1 + Math.max(0, fieles ?? 0) / 100);
}
const HUECO = 0.32;         // radianes libres arriba, donde se rotulan las fechas

/** Estilos del mundo vectorial. Se inyectan también en el SVG exportado. */
export const CSS_LIENZO = `
.banda{opacity:.05}
.rejilla{fill:none;stroke:var(--texto);stroke-opacity:.05;stroke-width:1;vector-effect:non-scaling-stroke}
.vida path,.rama path{fill:none;stroke-linecap:butt;stroke-linejoin:round}
.vida .post{stroke-dasharray:2 7}
.rama .punteada{stroke-dasharray:2 7}
.inf{fill:none;stroke-dasharray:7 6;opacity:.45}
.toque{stroke:transparent!important;stroke-width:16px!important;fill:none;cursor:pointer;pointer-events:stroke}
.nodo{cursor:pointer}
.nodo circle.base{fill:var(--fondo);stroke-width:2.6}
.nodo circle.claro{fill:#f6f3ea}
.nodo circle.tinte{opacity:.2}
.nodo.heredado circle.claro{fill-opacity:.5}
.nodo.heredado image{opacity:.5}
.nodo.extinta circle.base{stroke-dasharray:4 3.2}
.nodo .glifo{fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.nodo .glifo.relleno{stroke:none}
.nodo text,.rotulo{text-anchor:middle;font-family:var(--fuente);paint-order:stroke;stroke:var(--fondo);stroke-width:4.5px;stroke-linejoin:round}
.nodo .nombre{font-size:13px;font-weight:600;fill:var(--texto);letter-spacing:.1px}
.nodo .fecha{font-size:10.5px;fill:var(--tenue);font-variant-numeric:tabular-nums}
.nodo .halo{fill:none;stroke:var(--acento);stroke-width:2.4;opacity:0}
.nodo.sel .halo{opacity:1}
.rotulo.region{font-size:250px;font-weight:650;letter-spacing:10px;text-transform:uppercase;stroke-width:40px}
.rotulo.anio{font-size:84px;fill:var(--tenue);stroke-width:30px}
.tenue{opacity:.1}
.oculto{display:none}
`;

@Component({
  selector: 'app-eje-tiempo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="eje-tiempo">
      @for (m of marcas(); track m.anio) { <span [style.top.px]="m.y">{{ m.texto }}</span> }
    </div>`,
})
export class EjeTiempo {
  private datos = inject(Datos); private estado = inject(Estado); private i18n = inject(I18n);
  marcas = computed(() => {
    const v = this.estado.vista();
    const out: { anio: number; y: number; texto: string }[] = [];
    let ultimo = -1e9;
    for (const anio of this.datos.marcas) {
      const y = this.datos.yDe(anio) * v.k + v.ty;
      if (y < 52 || y > v.h - 8 || y - ultimo < 30) continue;
      ultimo = y;
      out.push({ anio, y, texto: this.i18n.anio(anio) });
    }
    return out;
  });
}

@Component({
  selector: 'app-eje-regiones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="eje-regiones">
      @for (r of franjas(); track r.id) {
        <i [style.left.px]="r.x0" [style.width.px]="r.w" [style.background]="r.color"></i>
        <span [style.left.px]="r.cx" [style.color]="r.color" [style.max-width.px]="r.w">{{ r.nombre }}</span>
      }
    </div>`,
})
export class EjeRegiones {
  private estado = inject(Estado);
  franjas = computed(() => {
    const v = this.estado.vista();
    return this.estado.trazado().regiones.map((r) => {
      const a = Math.max(r.x * v.k + v.tx + 3, 76), b = Math.min((r.x + r.ancho) * v.k + v.tx - 3, v.w);
      return { id: r.id, nombre: r.nombre, color: r.color, x0: a, w: b - a, cx: (a + b) / 2 };
    }).filter((f) => f.w > 24);
  });
}

interface Rama { rel: Relacion; d: string; trazo: string; w: number; punteada: boolean; a: string; b: string; }
interface Vida { r: Religion; d: string; post: string | null; w: number; }
interface Punto { r: Religion; x: number; y: number; }

/** Geometría del árbol en una de las dos presentaciones: columnas (territorios × tiempo) o radial. */
interface Escena {
  ancho: number; alto: number;
  bandas: { d: string; color: string }[]; rejilla: string[];
  vidas: Vida[]; ramas: Rama[]; influencias: Rama[]; lejanas: Rama[];
  nodos: Punto[]; degradados: { id: string; x1: number; y1: number; x2: number; y2: number; c1: string; c2: string }[];
  rotulos: { x: number; y: number; texto: string; clase: string; color: string | null }[];
  pos: Map<string, [number, number]>;
}

@Component({
  selector: 'app-lienzo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EjeTiempo, EjeRegiones],
  template: `
    <svg #svg class="lienzo" xmlns="http://www.w3.org/2000/svg"
         (pointerdown)="abajo($event)" (pointermove)="mover($event)" (pointerup)="arriba($event)" (pointercancel)="arriba($event)"
         (wheel)="rueda($event)" (click)="clicFondo()">
      @let e = escena();
      <g #mundo>
        <defs>
          @for (g of e.degradados; track g.id) {
            <linearGradient [attr.id]="g.id" gradientUnits="userSpaceOnUse" [attr.x1]="g.x1" [attr.y1]="g.y1" [attr.x2]="g.x2" [attr.y2]="g.y2">
              <stop offset="0" [attr.stop-color]="g.c1"/><stop offset="1" [attr.stop-color]="g.c2"/>
            </linearGradient>
          }
        </defs>
        @for (b of e.bandas; track $index) { <path class="banda" [attr.d]="b.d" [attr.fill]="b.color"/> }
        @if (estado.capaRejilla()) { @for (m of e.rejilla; track $index) { <path class="rejilla" [attr.d]="m"/> } }
        @for (t of e.rotulos; track $index) { <text class="rotulo" [class]="'rotulo ' + t.clase" [attr.x]="t.x" [attr.y]="t.y" [attr.fill]="t.color">{{ t.texto }}</text> }
        @if (estado.capaInfluencias()) {
          @for (i of e.influencias; track $index) {
            <g class="rama" [class.tenue]="tenueRel(i)" [class.oculto]="ocultaRel(i)">
              <path class="inf" [attr.d]="i.d" [attr.stroke]="i.trazo" [style.stroke-width]="ancho(i.w)" [style.opacity]="activa(i) ? 1 : null"/>
              <path class="toque" [attr.d]="i.d" (click)="elegirRel($event, i.rel)"/>
            </g>
          }
          @for (i of e.lejanas; track $index) {
            @if (activa(i)) { <path class="inf" style="opacity:1" [attr.d]="i.d" [attr.stroke]="i.trazo" [style.stroke-width]="ancho(i.w)"/> }
          }
        }
        @for (a of e.ramas; track $index) {
          <g class="rama" [class.tenue]="tenueRel(a)" [class.oculto]="ocultaRel(a)">
            <path [attr.d]="a.d" [attr.stroke]="a.trazo" [style.stroke-width]="ancho(a.w)" [class.punteada]="a.punteada"/>
            <path class="toque" [attr.d]="a.d" (click)="elegirRel($event, a.rel)"/>
          </g>
        }
        @for (v of e.vidas; track v.r.id) {
          <g class="vida" [class.tenue]="tenue(v.r.id)" [class.oculto]="oculto(v.r.id)">
            <path [attr.d]="v.d" [attr.stroke]="color(v.r)" [style.stroke-width]="ancho(v.w)"/>
            @if (v.post) { <path class="post" [attr.d]="v.post" [attr.stroke]="color(v.r)" [style.stroke-width]="ancho(v.w * .55)"/> }
            <path class="toque" [attr.d]="v.d + (v.post ?? '')" (click)="elegir($event, v.r)"><title>{{ v.r.nombre }}</title></path>
          </g>
        }
        @for (n of e.nodos; track n.r.id) {
          <g class="nodo" [attr.data-imp]="n.r.importancia" [attr.transform]="'translate(' + n.x + ' ' + n.y + ')'" [class.extinta]="n.r.fin !== null" [class.heredado]="n.r.heredado"
             [class.sel]="estado.seleccion() === n.r.id" [class.tenue]="tenue(n.r.id)" [class.oculto]="oculto(n.r.id)" (click)="elegir($event, n.r)">
            <g class="esc">
              <circle class="halo" [attr.r]="n.r.r + 6"/>
              <circle class="base" [class.claro]="n.r.icono" [attr.r]="n.r.r" [attr.stroke]="color(n.r)"/>
              @if (!n.r.icono) { <circle class="tinte" [attr.r]="n.r.r - 1.3" [attr.fill]="color(n.r)"/> }
              @if (n.r.icono) {
                <image [attr.href]="n.r.icono" [attr.x]="-n.r.r * esc(n.r)" [attr.y]="-n.r.r * esc(n.r)" [attr.width]="n.r.r * esc(n.r) * 2" [attr.height]="n.r.r * esc(n.r) * 2"/>
              } @else {
                <path class="glifo" [class.relleno]="glifo(n.r).relleno" [attr.d]="glifo(n.r).d" [attr.transform]="'scale(' + n.r.r / 15 + ')'"
                      [attr.stroke]="color(n.r)" [attr.fill]="glifo(n.r).relleno ? color(n.r) : 'none'"/>
              }
              <g class="etq" [attr.transform]="'translate(0 ' + (n.r.r + 3) + ')'"><g class="esc2">
                <text class="nombre" y="0">
                  @for (l of n.r.lineas; track $index) { <tspan x="0" dy="15">{{ l }}</tspan> }
                </text>
                <text class="fecha" [attr.y]="15 + n.r.lineas.length * 15">{{ i18n.periodo(n.r.inicio, n.r.fin) }}</text>
              </g></g>
            </g>
          </g>
        }
      </g>
    </svg>
    @if (!estado.radial()) { <app-eje-regiones/> <app-eje-tiempo/> }`,
})
export class Lienzo {
  datos = inject(Datos); estado = inject(Estado); i18n = inject(I18n);
  private svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private mundo = viewChild.required<ElementRef<SVGGElement>>('mundo');
  private k = 0.3; private tx = 0; private ty = 0; private kMin = 0.02;
  private punteros = new Map<number, { x: number; y: number }>();
  private arrastre = 0; private pendiente = 0; private animacion = 0;
  private etq: SVGGElement[] = []; private prioridad: number[] = [];

  escena = computed<Escena>(() => this.construir(this.estado.radial(), this.estado.trazado()));

  constructor() {
    effect((limpiar) => {
      this.escena();
      this.etq = [];
      const tarea = setTimeout(() => {
        this.inicio();
        const ir = this.estado.irA();
        if (ir && ir.id === this.estado.seleccion()) this.volar(ir.id);
      });
      limpiar(() => clearTimeout(tarea));
    });
    effect((limpiar) => {
      const ir = this.estado.irA();
      if (ir) {
        const tarea = setTimeout(() => this.volar(ir.id));
        limpiar(() => clearTimeout(tarea));
      }
    });
    effect((limpiar) => {
      this.estado.seleccion(); this.estado.ocultos();
      const tarea = setTimeout(() => this.aplicar());
      limpiar(() => clearTimeout(tarea));
    });
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.animacion);
      cancelAnimationFrame(this.pendiente);
    });
  }

  // ---- Geometría ---------------------------------------------------------------------
  private construir(radial: boolean, plano: Trazado): Escena {
    const d = this.datos, A = plano.ancho, H = d.alto;
    // El radio interior crece con el ancho para conservar la separación de los carriles.
    const R_INT = Math.max(260, A * .65 / (2 * Math.PI - HUECO));
    const R_EXT = R_INT + H, C = R_EXT + 900;
    const hoy = d.marcas[0];
    const ang = (x: number) => HUECO / 2 + (x / A) * (2 * Math.PI - HUECO);
    const rad = (y: number) => R_INT + (H - y);
    const P = (x: number, y: number): [number, number] =>
      radial ? [C + rad(y) * Math.sin(ang(x)), C - rad(y) * Math.cos(ang(x))] : [x, y];
    const f = (n: number) => +n.toFixed(1);
    const pt = (x: number, y: number) => { const [X, Y] = P(x, y); return `${f(X)} ${f(Y)}`; };
    const vert = (x: number, y1: number, y2: number) => `M${pt(x, y1)}L${pt(x, y2)}`;
    const arco = (y: number, x1: number, x2: number) => {       // continúa un trazo ya iniciado en (x1, y)
      if (!radial) return `L${pt(x2, y)}`;
      const r = f(rad(y)), grande = Math.abs(ang(x2) - ang(x1)) > Math.PI ? 1 : 0;
      return `A${r} ${r} 0 ${grande} ${x2 > x1 ? 1 : 0} ${pt(x2, y)}`;
    };
    const curva = (x1: number, y1: number, x2: number, y2: number, comba = 0) => {
      const mx = (x1 + x2) / 2;
      if (y1 === y2 && comba === 0) return `M${pt(x1, y1)}${arco(y1, x1, x2)}`;
      if (!radial) return `M${x1} ${y1}C${mx} ${y1 - comba} ${mx} ${y2 - comba} ${x2} ${y2}`;
      let s = '';
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, u = 1 - t;
        const x = u * u * u * x1 + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * x2;
        const y = u * u * u * y1 + 3 * u * u * t * (y1 - comba) + 3 * u * t * t * (y2 - comba) + t * t * t * y2;
        s += (i ? 'L' : 'M') + pt(x, y);
      }
      return s;
    };

    const e: Escena = { ancho: radial ? 2 * C : A, alto: radial ? 2 * C : H, bandas: [], rejilla: [], vidas: [], ramas: [], influencias: [], lejanas: [], nodos: [], degradados: [], rotulos: [], pos: new Map() };
    for (const g of plano.regiones) {
      const x1 = g.x, x2 = g.x + g.ancho;
      e.bandas.push({ color: g.color, d: radial
        ? `M${pt(x1, H)}L${pt(x1, 0)}${arco(0, x1, x2)}L${pt(x2, H)}A${R_INT} ${R_INT} 0 0 0 ${pt(x1, H)}Z`
        : `M${x1} 0H${x2}V${H}H${x1}Z` });
      if (radial) { const [X, Y] = P((x1 + x2) / 2, -420); e.rotulos.push({ x: X, y: Y, texto: g.nombre, clase: 'region', color: g.color }); }
    }
    let previa = -1e9;
    for (const m of d.marcas) {
      const y = d.yDe(m);
      e.rejilla.push(radial ? `M${pt(0, y)}${arco(y, 0, A / 2)}${arco(y, A / 2, A)}` : `M0 ${y}H${A}`);
      if (radial && Math.abs(y - previa) > 420) { previa = y; e.rotulos.push({ x: C, y: C - rad(y) + 28, texto: this.i18n.anio(m), clase: 'anio', color: null }); }
    }
    // Un giro redondeado sustituye el extremo de la vida. Cuando la vida continúa,
    // la rama nace en T y no duplica el tramo que ya dibuja el tronco.
    const finales = new Map<string, Relacion[]>();
    if (!radial) {
      for (const rel of d.relaciones) {
        if (!rel.principal) continue;
        const p = plano.porId.get(rel.origen)!, c = plano.porId.get(rel.destino)!;
        if (p.fin === null || Math.abs(p.yFin - c.y) > 0.1) continue;
        const lista = finales.get(p.id) ?? [];
        lista.push(rel);
        finales.set(p.id, lista);
      }
    }
    const giros = new Map<Relacion, number>();
    const cortes = new Map<string, number>();
    for (const [id, ramas] of finales) {
      if (ramas.length !== 1) continue;
      const rel = ramas[0], p = plano.porId.get(id)!, c = plano.porId.get(rel.destino)!;
      const lado = Math.sign(c.x - p.x);
      if (!lado) continue;
      const libre = Math.abs(c.x - p.x) - c.r - 1;
      const yVida = d.yDe(p.fin ?? hoy);
      const fin = p.yFin < yVida - 0.5 ? yVida : p.y;
      const radio = Math.min(24, libre / 2, (fin - c.y) / 2);
      if (radio <= 1) continue;
      giros.set(rel, radio);
      cortes.set(id, c.y + radio);
    }

    // Dos destinos en el mismo lado y año necesitan recorridos distintos.
    const coincidentes = new Map<string, Relacion[]>();
    for (const rel of d.relaciones) {
      if (!rel.principal) continue;
      const p = plano.porId.get(rel.origen)!, c = plano.porId.get(rel.destino)!;
      const lado = Math.sign(c.x - p.x);
      if (!lado) continue;
      const clave = `${p.id}:${c.y}:${lado}`;
      const lista = coincidentes.get(clave) ?? [];
      lista.push(rel);
      coincidentes.set(clave, lista);
    }
    const desvios = new Map<Relacion, string>();
    for (const grupo of coincidentes.values()) {
      if (grupo.length < 2) continue;
      const p = plano.porId.get(grupo[0].origen)!;
      const distancia = (rel: Relacion) => Math.abs(plano.porId.get(rel.destino)!.x - p.x);
      grupo.sort((a, b) => distancia(a) - distancia(b));
      const margen = Math.max(...grupo.map(rel => plano.porId.get(rel.destino)!.r)) + 16;
      const libre = Math.max(0, p.y - plano.porId.get(grupo[0].destino)!.y - p.r - 8);
      const paso = Math.min(22, Math.max(0, libre - margen) / Math.max(1, grupo.length - 2));
      for (const [i, rel] of grupo.slice(1).entries()) {
        const c = plano.porId.get(rel.destino)!, lado = Math.sign(c.x - p.x);
        const xf = c.x - lado * (c.r + 1), avance = Math.abs(xf - p.x);
        if (avance <= 2) continue;
        const x2 = xf - lado * Math.min(76, avance / 3);
        const offset = libre >= margen ? margen + i * paso : libre * ((i + 1) / grupo.length);
        if (offset < 1) continue;
        const y1 = c.y + offset;
        // La salida nace en el tronco en una fecha anterior. Después solo avanza
        // horizontalmente o hacia el presente, también tras la proyección radial.
        const tramo = radial
          ? curva(x2, y1, xf, c.y).slice(('M' + pt(x2, y1)).length)
          : `C${pt(x2 + (xf - x2) * .4, y1)} ${pt(x2 + (xf - x2) * .7, c.y)} ${pt(xf, c.y)}`;
        desvios.set(rel, `M${pt(p.x, y1)}${arco(y1, p.x, x2)}${tramo}`);
      }
    }
    for (const r of plano.religiones) {
      const [X, Y] = P(r.x, r.y);
      e.pos.set(r.id, [X, Y]); e.nodos.push({ r, x: X, y: Y });
      const yFinal = cortes.get(r.id) ?? r.yFin;
      if (yFinal < r.y - 0.5) {
        const yVida = Math.min(r.y, d.yDe(r.fin ?? hoy)), corte = Math.max(yFinal, yVida);
        e.vidas.push({ r, w: grosorPorFieles(r.fieles), d: vert(r.x, r.y, corte), post: yFinal < corte - 0.5 ? vert(r.x, corte, yFinal) : null });
      }
    }
    for (const rel of d.relaciones) {
      const p = plano.porId.get(rel.origen)!, c = plano.porId.get(rel.destino)!;
      const lado = Math.sign(c.x - p.x) || 1, xf = c.x - lado * (c.r + 1);
      let trazo = d.region.get(c.region)!.color;
      const sy = Math.min(p.y, Math.max(p.yFin, c.y));
      if (p.region !== c.region) {
        const id = `g${radial ? 'r' : 'c'}-${p.id}-${c.id}-${rel.clase}`, [a1, b1] = P(p.x, sy), [a2, b2] = P(c.x, c.y);
        e.degradados.push({ id, x1: a1, y1: b1, x2: a2, y2: b2, c1: d.region.get(p.region)!.color, c2: trazo });
        trazo = `url(#${id})`;
      }
      const w = grosorPorFieles(c.fieles);
      if (rel.principal) {
        const rc = giros.get(rel) ?? 0;
        const camino = desvios.get(rel) ?? (rc > 1
          ? `M${p.x} ${c.y + rc}Q${p.x} ${c.y} ${p.x + lado * rc} ${c.y}H${xf}`
          : `M${pt(p.x, c.y)}${arco(c.y, p.x, xf)}`);
        e.ramas.push({ rel, d: camino, trazo, w, punteada: rel.clase === 'renacimiento', a: p.id, b: c.id });
      } else {
        const lejos = rel.clase === 'influencia' && (p.region !== c.region || Math.abs(p.x - c.x) > 1500);
        const comba = rel.clase === 'influencia' && sy === c.y ? 46 : 0;
        const obj = { rel, d: curva(p.x, sy, xf, c.y, comba), trazo, w: Math.max(1.6, w * 0.4), punteada: false, a: p.id, b: c.id };
        (rel.clase !== 'influencia' ? e.ramas : lejos ? e.lejanas : e.influencias).push(obj);
      }
    }
    return e;
  }

  color(r: Religion) { return this.datos.region.get(r.region)!.color; }
  /** Un símbolo heredado del tronco se dibuja más pequeño y atenuado: no es el emblema propio. */
  esc(r: Religion) { return r.heredado ? 0.46 : 0.64; }
  ancho(w: number) { return `calc(${w}px * var(--escw, 1))`; }
  glifo(r: Religion) { return GLIFOS[r.tipo] ?? GLIFOS['mon']; }
  tenue(id: string) { const f = this.estado.foco(); return !!f && !f.has(id); }
  oculto(id: string) { return this.estado.ocultos().has(id); }
  tenueRel(a: Rama) {
    const f = this.estado.foco(); if (!f) return false;
    const s = this.estado.seleccion(), rel = this.estado.relacion();
    if (rel) return rel !== a.rel;
    return !(f.has(a.a) && f.has(a.b) && (a.rel.clase !== 'influencia' || a.a === s || a.b === s));
  }
  activa(a: Rama) { return !!this.estado.foco() && !this.tenueRel(a); }
  ocultaRel(a: Rama) { const o = this.estado.ocultos(); return o.has(a.a) || o.has(a.b); }

  elegir(e: Event, r: Religion) { e.stopPropagation(); if (this.arrastre < 5) this.estado.elegir(r); }
  elegirRel(e: Event, rel: Relacion) { e.stopPropagation(); if (this.arrastre < 5) this.estado.elegirRelacion(rel); }
  clicFondo() { if (this.arrastre < 5) this.estado.elegir(null); }

  // ---- Vista: desplazamiento y zoom -------------------------------------------------
  private tam() { const b = this.svg().nativeElement.getBoundingClientRect(); return { w: b.width, h: b.height }; }
  /** Vista inicial: el árbol completo encajado en pantalla. */
  private inicio() {
    cancelAnimationFrame(this.animacion);
    const { w, h } = this.tam(), e = this.escena(), radial = this.estado.radial();
    const mx = radial ? 20 : 84, my = radial ? 20 : 50;
    this.kMin = Math.min((w - mx - 16) / e.ancho, (h - my - 12) / e.alto) * 0.92;
    this.k = this.kMin / 0.92;
    this.tx = mx + (w - mx - e.ancho * this.k) / 2; this.ty = my + (h - my - e.alto * this.k) / 2;
    this.aplicar();
  }
  private aplicar() {
    const { w, h } = this.tam(), e = this.escena(), m = 240;
    this.k = Math.max(this.kMin, Math.min(8, this.k));
    this.tx = Math.min(w - m, Math.max(m - e.ancho * this.k, this.tx));
    this.ty = Math.min(h - m, Math.max(m - e.alto * this.k, this.ty));
    const g = this.mundo().nativeElement, s = this.svg().nativeElement, k = this.k;
    g.setAttribute('transform', `translate(${this.tx} ${this.ty}) scale(${k})`);
    const escN = Math.max(1, Math.min(4.5, 0.34 / k)), escL = Math.max(1, Math.min(11, 0.72 / k));
    s.style.setProperty('--esc', String(escN));
    s.style.setProperty('--esc2', String(escL / escN));
    s.style.setProperty('--escw', String(Math.max(1, Math.min(3.2, 0.3 / k))));
    s.dataset['lod'] = k >= 0.6 ? '1' : k >= 0.4 ? '2' : k >= 0.24 ? '3' : k >= 0.12 ? '4' : '5';
    if (!this.pendiente) this.pendiente = requestAnimationFrame(() => {
      this.pendiente = 0;
      this.etiquetas(w, h, escN, escL);
      this.estado.vista.set({ k: this.k, tx: this.tx, ty: this.ty, w, h });
    });
  }
  /** Muestra tantas etiquetas como quepan sin pisarse, dando prioridad a las tradiciones de más peso. */
  private etiquetas(w: number, h: number, escN: number, escL: number) {
    const nodos = this.escena().nodos, k = this.k;
    if (this.etq.length !== nodos.length || !this.etq[0]?.isConnected) {
      this.etq = Array.from(this.mundo().nativeElement.querySelectorAll<SVGGElement>('.etq'));
      this.prioridad = nodos.map((_, i) => i).sort((a, b) => nodos[b].r.importancia - nodos[a].r.importancia || nodos[a].r.inicio - nodos[b].r.inicio);
      if (this.etq.length !== nodos.length) { this.etq = []; return; }
    }
    const puestas: number[][] = [], sel = this.estado.seleccion(), legible = 13 * escL * k >= 7.5;
    for (const i of this.prioridad) {
      const n = nodos[i], sx = n.x * k + this.tx, sy = n.y * k + this.ty;
      if (sx < -160 || sx > w + 160 || sy < -160 || sy > h + 160) continue;
      const car = Math.max(...n.r.lineas.map((l) => l.length), 11);
      const mw = (car * 7.3 * escL * k) / 2 + 3, y0 = sy + (n.r.r + 3) * escN * k, y1 = y0 + (n.r.lineas.length * 15 + 20) * escL * k;
      const libre = legible && !puestas.some((p) => sx - mw < p[2] && sx + mw > p[0] && y0 < p[3] && y1 > p[1]);
      if (libre || n.r.id === sel) puestas.push([sx - mw, y0, sx + mw, y1]);
      this.etq[i].style.display = libre || n.r.id === sel ? '' : 'none';
    }
  }
  zoom(factor: number, cx?: number, cy?: number) {
    const { w, h } = this.tam(); cx ??= w / 2; cy ??= h / 2;
    const k2 = Math.max(this.kMin, Math.min(8, this.k * factor)), f = k2 / this.k;
    this.tx = cx - (cx - this.tx) * f; this.ty = cy - (cy - this.ty) * f; this.k = k2;
    this.aplicar();
  }
  rueda(e: WheelEvent) {
    e.preventDefault(); cancelAnimationFrame(this.animacion);
    const b = this.svg().nativeElement.getBoundingClientRect();
    if (e.ctrlKey || !e.shiftKey) this.zoom(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX - b.left, e.clientY - b.top);
    else { this.tx -= e.deltaY; this.aplicar(); }
  }
  abajo(e: PointerEvent) {
    cancelAnimationFrame(this.animacion);
    if (this.punteros.size === 0) this.arrastre = 0;
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  mover(e: PointerEvent) {
    const previo = this.punteros.get(e.pointerId); if (!previo) return;
    const dx = e.clientX - previo.x, dy = e.clientY - previo.y;
    if (this.punteros.size === 2) {
      const otro = [...this.punteros.entries()].find(([id]) => id !== e.pointerId)![1];
      const antes = Math.hypot(previo.x - otro.x, previo.y - otro.y), ahora = Math.hypot(e.clientX - otro.x, e.clientY - otro.y);
      const b = this.svg().nativeElement.getBoundingClientRect();
      if (antes > 0) this.zoom(ahora / antes, (e.clientX + otro.x) / 2 - b.left, (e.clientY + otro.y) / 2 - b.top);
    }
    this.arrastre += Math.abs(dx) + Math.abs(dy);
    if (this.arrastre >= 5) (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    this.tx += dx / this.punteros.size; this.ty += dy / this.punteros.size;
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.aplicar();
  }
  arriba(e: PointerEvent) { this.punteros.delete(e.pointerId); }
  @HostListener('window:resize') redimensionar() { this.aplicar(); }
  @HostListener('window:keydown', ['$event']) tecla(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT' || this.estado.enciclopedia()) return;
    const paso = 90;
    if (e.key === '+' || e.key === '=') this.zoom(1.25);
    else if (e.key === '-') this.zoom(0.8);
    else if (e.key === '0') this.inicio();
    else if (e.key === 'ArrowLeft') { this.tx += paso; this.aplicar(); }
    else if (e.key === 'ArrowRight') { this.tx -= paso; this.aplicar(); }
    else if (e.key === 'ArrowUp') { this.ty += paso; this.aplicar(); }
    else if (e.key === 'ArrowDown') { this.ty -= paso; this.aplicar(); }
    else if (e.key === 'Escape') this.estado.elegir(null);
  }

  /** Desplazamiento animado hasta una tradición. */
  volar(id: string) {
    const p = this.escena().pos.get(id); if (!p) return;
    const { w, h } = this.tam();
    const k1 = Math.max(this.k, 0.8), a = { k: this.k, tx: this.tx, ty: this.ty };
    // En horizontal la ficha queda a la derecha. Centra el nodo en la parte visible del mapa.
    const apaisado = matchMedia('(orientation: landscape)').matches;
    const limiteIzquierdo = this.estado.radial() ? 0 : 76;
    const bordeFicha = w - Math.min(372, w / 2) - 12;
    const centroX = apaisado ? (limiteIzquierdo + bordeFicha) / 2 : (w + 380) / 2;
    const b = { k: k1, tx: centroX - p[0] * k1, ty: h / 2 - p[1] * k1 };
    const t0 = performance.now(), dur = 850;
    cancelAnimationFrame(this.animacion);
    const paso = (t: number) => {
      const u = Math.min(1, (t - t0) / dur), s = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      this.k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * s);
      this.tx = a.tx + (b.tx - a.tx) * s; this.ty = a.ty + (b.ty - a.ty) * s;
      this.aplicar();
      if (u < 1) this.animacion = requestAnimationFrame(paso);
    };
    this.animacion = requestAnimationFrame(paso);
  }

  /** Exporta el árbol completo como SVG vectorial autónomo (iconos incrustados). */
  async exportar(): Promise<void> {
    const e = this.escena(), css = getComputedStyle(document.documentElement);
    const v = (n: string) => css.getPropertyValue(n).trim();
    const copia = this.mundo().nativeElement.cloneNode(true) as SVGGElement;
    copia.removeAttribute('transform');
    copia.querySelectorAll('.toque, .halo').forEach((n) => n.remove());
    copia.querySelectorAll('.tenue').forEach((n) => n.classList.remove('tenue'));
    for (const img of Array.from(copia.querySelectorAll('image'))) {
      try {
        const txt = await (await fetch(img.getAttribute('href')!)).text();
        img.setAttribute('href', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(txt))));
      } catch { img.remove(); }
    }
    const estilos = CSS_LIENZO.replace(/var\(--(\w+)\)/g, (_, n) => v('--' + n));
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${e.ancho} ${e.alto}" width="${e.ancho}" height="${e.alto}">` +
      `<style>${estilos}</style><rect width="100%" height="100%" fill="${v('--fondo')}"/>${new XMLSerializer().serializeToString(copia)}</svg>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = 'relitree.svg'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
}
