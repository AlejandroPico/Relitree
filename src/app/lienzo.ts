import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, viewChild } from '@angular/core';
import { Datos, Relacion, Religion } from './datos';
import { Estado } from './estado';
import { I18n } from './i18n';
import { GLIFOS } from './glifos';

const GROSOR = [0, 2, 3.2, 5, 7.5, 11];

/** Estilos del mundo vectorial. Se inyectan también en el SVG exportado. */
export const CSS_LIENZO = `
.banda{opacity:.045}
.rejilla{stroke:var(--texto);stroke-opacity:.045;stroke-width:1;vector-effect:non-scaling-stroke}
.vida line,.rama line,.rama path{stroke-linecap:round;fill:none}
.ext{stroke-dasharray:1 9;stroke-linecap:round}
.punteada{stroke-dasharray:1 9}
.inf{fill:none;stroke-width:1.5;stroke-dasharray:7 6;opacity:.38}
.toque{stroke:transparent!important;stroke-width:16;fill:none;cursor:pointer;pointer-events:stroke}
.nodo{cursor:pointer}
.nodo circle{fill:var(--fondo);stroke-width:2.6}
.nodo circle.claro{fill:#f6f3ea}
.nodo .glifo{fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.nodo .glifo.relleno{stroke:none}
.nodo text{text-anchor:middle;font-family:var(--fuente);paint-order:stroke;stroke:var(--fondo);stroke-width:4.5px;stroke-linejoin:round}
.nodo .nombre{font-size:13px;font-weight:600;fill:var(--texto);letter-spacing:.1px}
.nodo .fecha{font-size:10.5px;fill:var(--tenue);font-variant-numeric:tabular-nums}
.nodo .halo{fill:none;stroke:var(--acento);stroke-width:2;opacity:0}
.nodo.sel .halo{opacity:1}
.nodo:hover circle.base{stroke-width:4}
.copa{text-anchor:middle;font:500 10.5px var(--fuente);fill:var(--tenue)}
.talon{cursor:pointer}
.talon text{font:500 10px var(--fuente);opacity:.85}
.tenue{opacity:.13}
.oculto{display:none}
`;

@Component({
  selector: 'app-eje-tiempo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="eje-tiempo">
      @for (m of marcas(); track m.anio) {
        <span [style.top.px]="m.y">{{ m.texto }}</span>
      }
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
      if (y < 96 || y > v.h - 8 || y - ultimo < 30) continue;
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
  private datos = inject(Datos); private estado = inject(Estado);
  franjas = computed(() => {
    const v = this.estado.vista();
    return this.datos.regiones.map((r) => {
      const a = Math.max(r.x * v.k + v.tx + 3, 76), b = Math.min((r.x + r.ancho) * v.k + v.tx - 3, v.w);
      return { id: r.id, nombre: r.nombre, color: r.color, x0: a, w: b - a, cx: (a + b) / 2 };
    }).filter((f) => f.w > 24);
  });
}

interface Rama { rel: Relacion; d: string; trazo: string; w: number; punteada: boolean; a: string; b: string; larga?: Talon; }
/** Rama a distancia: solo se dibujan dos talones difuminados hasta que se selecciona. */
interface Talon { xh: number; yh: number; fh: string; xp: number; yp: number; fp: string; tx: number; ancla: string; texto: string; color: string; }

@Component({
  selector: 'app-lienzo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EjeTiempo, EjeRegiones],
  template: `
    <svg #svg class="lienzo" xmlns="http://www.w3.org/2000/svg"
         (pointerdown)="abajo($event)" (pointermove)="mover($event)" (pointerup)="arriba($event)" (pointercancel)="arriba($event)"
         (wheel)="rueda($event)" (click)="clicFondo($event)">
      <g #mundo>
        <defs>
          @for (g of degradados; track g.id) {
            <linearGradient [attr.id]="g.id" gradientUnits="userSpaceOnUse" [attr.x1]="g.x1" [attr.x2]="g.x2" y1="0" y2="0">
              <stop offset="0" [attr.stop-color]="g.c1"/><stop offset="1" [attr.stop-color]="g.c2"/>
            </linearGradient>
          }
          @for (r of datos.regiones; track r.id) {
            <linearGradient [attr.id]="'f-' + r.id + '-d'"><stop offset="0" [attr.stop-color]="r.color"/><stop offset="1" [attr.stop-color]="r.color" stop-opacity="0"/></linearGradient>
            <linearGradient [attr.id]="'f-' + r.id + '-i'"><stop offset="0" [attr.stop-color]="r.color" stop-opacity="0"/><stop offset="1" [attr.stop-color]="r.color"/></linearGradient>
          }
        </defs>
        @for (r of datos.regiones; track r.id) {
          <rect class="banda" [attr.x]="r.x" y="0" [attr.width]="r.ancho" [attr.height]="datos.alto" [attr.fill]="r.color"/>
        }
        @if (estado.capaRejilla()) {
          @for (m of rejilla; track m) { <line class="rejilla" x1="0" [attr.x2]="datos.ancho" [attr.y1]="m" [attr.y2]="m"/> }
        }
        @if (estado.capaInfluencias()) {
          @for (i of influencias; track $index) {
            <g class="rama" [class.tenue]="tenueRel(i)" [class.oculto]="ocultaRel(i)">
              <path class="inf" [attr.d]="i.d" [attr.stroke]="i.trazo" [style.opacity]="activa(i) ? 1 : null"/>
              <path class="toque" [attr.d]="i.d" (click)="elegirRel($event, i.rel)"/>
            </g>
          }
        }
        @for (i of lejanas; track $index) {
          @if (activa(i)) { <path class="inf" style="opacity:1" [attr.d]="i.d" [attr.stroke]="i.trazo"/> }
        }
        @for (r of datos.religiones; track r.id) {
          <g class="vida" [class.tenue]="tenue(r.id)" [class.oculto]="oculto(r.id)">
            <line [attr.x1]="r.x" [attr.x2]="r.x" [attr.y1]="r.y" [attr.y2]="r.yFin" [attr.stroke]="color(r)" [attr.stroke-width]="grosor(r)"/>
            @if (ext.get(r.id); as e) {
              <line class="ext" [attr.x1]="r.x" [attr.x2]="r.x" [attr.y1]="r.yFin" [attr.y2]="e" [attr.stroke]="color(r)" [attr.stroke-width]="grosor(r) * .6"/>
            }
            @if (r.fin !== null) {
              <line [attr.x1]="r.x - 7 - grosor(r)" [attr.x2]="r.x + 7 + grosor(r)" [attr.y1]="r.yFin" [attr.y2]="r.yFin" [attr.stroke]="color(r)" stroke-width="2.4"/>
            }
            @if (r.fin === null) {
              <text class="copa" [attr.x]="r.x" [attr.y]="r.yFin - 14 - (r.lineas.length - 1) * 12">
                @for (l of r.lineas; track $index) { <tspan [attr.x]="r.x" [attr.dy]="$index ? 12 : 0">{{ l }}</tspan> }
              </text>
            }
            <line class="toque" [attr.x1]="r.x" [attr.x2]="r.x" [attr.y1]="r.y" [attr.y2]="r.yFin" (click)="elegir($event, r)"><title>{{ r.nombre }}</title></line>
          </g>
        }
        @for (a of ramas; track $index) {
          <g class="rama" [class.tenue]="tenueRel(a)" [class.oculto]="ocultaRel(a)">
            @if (a.larga && !activa(a)) {
              <g class="talon" (click)="elegirRel($event, a.rel)">
                <rect [attr.x]="a.larga.xh" [attr.y]="a.larga.yh - a.w / 2" width="110" [attr.height]="a.w" [attr.fill]="a.larga.fh"/>
                <rect [attr.x]="a.larga.xp" [attr.y]="a.larga.yp - a.w / 2" width="110" [attr.height]="a.w" [attr.fill]="a.larga.fp"/>
                <text [attr.x]="a.larga.tx" [attr.y]="a.larga.yh - a.w / 2 - 6" [attr.text-anchor]="a.larga.ancla" [attr.fill]="a.larga.color">{{ a.larga.texto }}</text>
              </g>
            } @else {
              <path [attr.d]="a.d" [attr.stroke]="a.trazo" [attr.stroke-width]="a.w" [class.punteada]="a.punteada"/>
              <path class="toque" [attr.d]="a.d" (click)="elegirRel($event, a.rel)"/>
            }
          </g>
        }
        @for (r of datos.religiones; track r.id) {
          <g class="nodo" [attr.data-imp]="r.importancia" [attr.transform]="'translate(' + r.x + ' ' + r.y + ')'"
             [class.sel]="estado.seleccion() === r.id" [class.tenue]="tenue(r.id)" [class.oculto]="oculto(r.id)" (click)="elegir($event, r)">
            <g class="esc">
              <circle class="halo" [attr.r]="r.r + 6"/>
              <circle class="base" [class.claro]="r.icono" [attr.r]="r.r" [attr.stroke]="color(r)"/>
              @if (r.icono) {
                <image [attr.href]="r.icono" [attr.x]="-r.r * .64" [attr.y]="-r.r * .64" [attr.width]="r.r * 1.28" [attr.height]="r.r * 1.28"/>
              } @else {
                <path class="glifo" [class.relleno]="glifo(r).relleno" [attr.d]="glifo(r).d" [attr.transform]="'scale(' + r.r / 15 + ')'"
                      [attr.stroke]="color(r)" [attr.fill]="glifo(r).relleno ? color(r) : 'none'"/>
              }
              <text class="nombre" [attr.y]="r.r + 5">
                @for (l of r.lineas; track $index) { <tspan x="0" dy="15">{{ l }}</tspan> }
              </text>
              <text class="fecha" [attr.y]="r.r + 20 + r.lineas.length * 15">{{ i18n.periodo(r.inicio, r.fin) }}</text>
            </g>
          </g>
        }
      </g>
    </svg>
    <app-eje-regiones/>
    <app-eje-tiempo/>`,
})
export class Lienzo {
  datos = inject(Datos); estado = inject(Estado); i18n = inject(I18n);
  private svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private mundo = viewChild.required<ElementRef<SVGGElement>>('mundo');
  private k = 0.3; private tx = 0; private ty = 0; private kMin = 0.02;
  private punteros = new Map<number, { x: number; y: number }>();
  private arrastre = 0; private pendiente = 0; private animacion = 0;

  ext = new Map<string, number>();
  ramas: Rama[] = []; influencias: Rama[] = []; lejanas: Rama[] = [];
  degradados: { id: string; x1: number; x2: number; c1: string; c2: string }[] = [];
  rejilla = this.datos.marcas.map((m) => this.datos.yDe(m));

  constructor() {
    const d = this.datos;
    for (const rel of d.relaciones) {
      const p = d.porId.get(rel.origen)!, c = d.porId.get(rel.destino)!;
      const lado = Math.sign(c.x - p.x);
      const xf = c.x - lado * (c.r + 1);
      let trazo = d.region.get(c.region)!.color;
      if (p.region !== c.region && lado !== 0) {
        const id = `g-${p.id}-${c.id}`;
        this.degradados.push({ id, x1: p.x, x2: c.x, c1: d.region.get(p.region)!.color, c2: trazo });
        trazo = `url(#${id})`;
      }
      const w = GROSOR[c.importancia];
      const indirecta = rel.clase === 'renacimiento' || (p.fin !== null && c.inicio - p.fin > 300);
      const lejos = p.region !== c.region || indirecta;
      const talon = (): Talon => {
        const yp = Math.min(p.y, Math.max(p.yFin, c.y)), l = lado || 1;
        return {
          xh: l > 0 ? xf - 110 : xf, yh: c.y, fh: `url(#f-${p.region}-${l > 0 ? 'i' : 'd'})`,
          xp: l > 0 ? p.x : p.x - 110, yp, fp: `url(#f-${c.region}-${l > 0 ? 'd' : 'i'})`,
          tx: l > 0 ? xf - 8 : xf + 8, ancla: l > 0 ? 'end' : 'start', texto: p.nombre, color: d.region.get(p.region)!.color,
        };
      };
      if (rel.principal) {
        if (c.y < p.yFin && !indirecta) this.ext.set(p.id, Math.min(this.ext.get(p.id) ?? p.yFin, c.y));
        const sy = Math.min(p.y, Math.max(p.yFin, c.y));
        const camino = sy === c.y ? `M${p.x} ${c.y}H${xf}` : `M${p.x} ${sy}V${c.y}H${xf}`;
        if (lado !== 0 || lejos) this.ramas.push({ rel, d: camino, trazo, w, punteada: rel.clase === 'renacimiento', a: p.id, b: c.id, larga: lejos ? talon() : undefined });
      } else if (rel.clase === 'influencia' && (p.region !== c.region || Math.abs(p.x - c.x) > 1100)) {
        const sy = Math.min(p.y, Math.max(p.yFin, c.y)), mx = (p.x + c.x) / 2;
        this.lejanas.push({ rel, d: `M${p.x} ${sy}C${mx} ${sy} ${mx} ${c.y} ${xf} ${c.y}`, trazo, w: 1.5, punteada: false, a: p.id, b: c.id });
      } else {
        const sy = Math.min(p.y, Math.max(p.yFin, c.y)), mx = (p.x + c.x) / 2, arco = sy === c.y ? 46 : 0;
        const camino = `M${p.x} ${sy}C${mx} ${sy - arco} ${mx} ${c.y - arco} ${xf} ${c.y}`;
        const obj = { rel, d: camino, trazo, w: Math.max(1.8, w * 0.45), punteada: false, a: p.id, b: c.id };
        (rel.clase === 'influencia' ? this.influencias : this.ramas).push(obj);
      }
    }
    effect(() => { const o = this.estado.irA(); if (o) this.volar(o.id); });
    queueMicrotask(() => this.inicio());
  }

  color(r: Religion) { return this.datos.region.get(r.region)!.color; }
  grosor(r: Religion) { return GROSOR[r.importancia]; }
  glifo(r: Religion) { return GLIFOS[r.tipo] ?? GLIFOS['mon']; }
  tenue(id: string) { const f = this.estado.foco(); return !!f && !f.has(id); }
  oculto(id: string) { return this.estado.ocultos().has(id); }
  tenueRel(a: Rama) {
    const f = this.estado.foco(); if (!f) return false;
    const s = this.estado.seleccion(), rel = this.estado.relacion();
    if (rel) return rel !== a.rel;
    return !(f.has(a.a) && f.has(a.b) && (a.rel.principal || a.a === s || a.b === s));
  }
  activa(a: Rama) { return !!this.estado.foco() && !this.tenueRel(a); }
  ocultaRel(a: Rama) { const o = this.estado.ocultos(); return o.has(a.a) || o.has(a.b); }

  elegir(e: Event, r: Religion) { e.stopPropagation(); if (this.arrastre < 5) this.estado.elegir(r); }
  elegirRel(e: Event, rel: Relacion) { e.stopPropagation(); if (this.arrastre < 5) this.estado.elegirRelacion(rel); }
  clicFondo(_: Event) { if (this.arrastre < 5) this.estado.elegir(null); }

  // ---- Vista: desplazamiento y zoom -------------------------------------------------
  private tam() { const b = this.svg().nativeElement.getBoundingClientRect(); return { w: b.width, h: b.height }; }
  private inicio() {
    const { w, h } = this.tam();
    this.kMin = Math.min(w / this.datos.ancho, h / this.datos.alto) * 0.9;
    const cristianismo = this.datos.porId.get('cristianismo');
    this.k = Math.max(this.kMin, Math.min(0.42, w / 4200));
    const cx = cristianismo?.x ?? this.datos.ancho / 2;
    this.tx = w / 2 - cx * this.k; this.ty = h / 2 - this.datos.yDe(700) * this.k;
    this.aplicar();
  }
  private aplicar() {
    const { w, h } = this.tam(), d = this.datos, m = 240;
    this.k = Math.max(this.kMin, Math.min(8, this.k));
    this.tx = Math.min(w - m, Math.max(m - d.ancho * this.k, this.tx));
    this.ty = Math.min(h - m, Math.max(m - d.alto * this.k, this.ty));
    const g = this.mundo().nativeElement, s = this.svg().nativeElement;
    g.setAttribute('transform', `translate(${this.tx} ${this.ty}) scale(${this.k})`);
    s.style.setProperty('--esc', String(Math.max(1, Math.min(13, 0.66 / this.k))));
    s.dataset['lod'] = this.k >= 0.72 ? '1' : this.k >= 0.46 ? '2' : this.k >= 0.27 ? '3' : this.k >= 0.13 ? '4' : '5';
    if (!this.pendiente) this.pendiente = requestAnimationFrame(() => {
      this.pendiente = 0;
      this.estado.vista.set({ k: this.k, tx: this.tx, ty: this.ty, w, h });
    });
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
    else if (e.key === 'ArrowLeft') { this.tx += paso; this.aplicar(); }
    else if (e.key === 'ArrowRight') { this.tx -= paso; this.aplicar(); }
    else if (e.key === 'ArrowUp') { this.ty += paso; this.aplicar(); }
    else if (e.key === 'ArrowDown') { this.ty -= paso; this.aplicar(); }
    else if (e.key === 'Escape') this.estado.elegir(null);
  }

  /** Desplazamiento animado hasta una tradición. */
  volar(id: string) {
    const r = this.datos.porId.get(id); if (!r) return;
    const { w, h } = this.tam();
    const k1 = Math.max(this.k, 0.95), a = { k: this.k, tx: this.tx, ty: this.ty };
    const b = { k: k1, tx: (w - 380) / 2 - r.x * k1, ty: h / 2 - r.y * k1 };
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
    const d = this.datos, css = getComputedStyle(document.documentElement);
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
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.ancho} ${d.alto}" width="${d.ancho}" height="${d.alto}">` +
      `<style>${estilos}</style><rect width="100%" height="100%" fill="${v('--fondo')}"/>${new XMLSerializer().serializeToString(copia)}</svg>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = 'relitree.svg'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
}
