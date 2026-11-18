import { DestroyRef, Directive, ElementRef, HostListener, effect, inject, input, output } from '@angular/core';

type Plano = { ancho: number; alto: number };
type Punto = { x: number; y: number };

/** Navega por un SVG con un plano propio o arrastra una superficie desplazable, como la matriz. */
@Directive({ selector: '[relDesplazamiento]' })
export class Desplazamiento {
  readonly plano = input<Plano | null>(null);
  readonly ajuste = input<'ancho' | 'encajar' | 'natural'>('ancho');
  readonly escena = input<string | number>('');
  readonly focoX = input<number>();
  readonly focoY = input<number>();
  readonly zoom = input<number>();
  readonly zoomCambio = output<number>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private puntos = new Map<number, Punto>();
  private movimiento = false;
  private inicio: Punto = { x: 0, y: 0 };
  private x = 0;
  private y = 0;
  private porcentaje = 100;
  private base = 1;
  private w = 0;
  private h = 0;
  private readonly clic = (e: MouseEvent) => {
    if (e.detail && this.movimiento) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.movimiento = false;
    }
  };

  constructor() {
    const ro = new ResizeObserver(() => this.medir());
    ro.observe(this.el);
    this.el.addEventListener('click', this.clic, true);
    inject(DestroyRef).onDestroy(() => {
      ro.disconnect();
      this.el.removeEventListener('click', this.clic, true);
    });
    effect((limpiar) => {
      const p = this.plano(), ajuste = this.ajuste(), x = this.focoX(), y = this.focoY();
      this.escena();
      if (!p) return;
      const tarea = requestAnimationFrame(() => this.encuadrar(p, ajuste, x, y));
      limpiar(() => cancelAnimationFrame(tarea));
    });
    effect(() => {
      const zoom = this.zoom();
      if (zoom !== undefined && zoom !== Math.round(this.porcentaje)) {
        this.escalar(zoom, { x: this.w / 2, y: this.h / 2 }, false);
      }
    });
  }

  private medir() {
    const p = this.plano();
    if (p) this.encuadrar(p, this.ajuste(), this.focoX(), this.focoY());
  }

  private encuadrar(p: Plano, ajuste: 'ancho' | 'encajar' | 'natural', x?: number, y?: number) {
    this.w = this.el.clientWidth;
    this.h = this.el.clientHeight;
    if (!this.w || !this.h) return;
    const porAncho = this.w / p.ancho;
    this.base = ajuste === 'encajar' ? Math.min(porAncho, this.h / p.alto)
      : ajuste === 'natural' ? Math.max(.82, porAncho) : porAncho;
    const k = this.base * this.porcentaje / 100;
    this.x = x === undefined ? 0 : this.w / 2 - x * k;
    this.y = y === undefined ? 0 : this.h / 2 - y * k;
    this.render();
  }

  private escalar(nuevo: number, centro: Punto, notificar: boolean, anteriores = centro) {
    if (!this.plano()) return;
    const porcentaje = Math.max(35, Math.min(800, nuevo));
    const factor = porcentaje / this.porcentaje;
    this.x = centro.x - (anteriores.x - this.x) * factor;
    this.y = centro.y - (anteriores.y - this.y) * factor;
    this.porcentaje = porcentaje;
    this.render();
    if (notificar) this.zoomCambio.emit(Math.round(porcentaje));
  }

  private render() {
    const p = this.plano();
    if (!p) return;
    const k = this.base * this.porcentaje / 100;
    const limitar = (p: number, lienzo: number, vista: number) => lienzo <= vista ? (vista - lienzo) / 2
      : Math.min(0, Math.max(vista - lienzo, p));
    this.x = limitar(this.x, p.ancho * k, this.w);
    this.y = limitar(this.y, p.alto * k, this.h);
    this.el.style.setProperty('--vis-ancho', p.ancho + 'px');
    this.el.style.setProperty('--vis-alto', p.alto + 'px');
    this.el.style.setProperty('--vis-transform', 'translate(' + this.x + 'px,' + this.y + 'px) scale(' + k + ')');
  }

  private punto(e: MouseEvent): Punto {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  @HostListener('wheel', ['$event']) rueda(e: WheelEvent) {
    if (!this.plano()) return;
    e.preventDefault();
    const paso = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * this.h : e.deltaY;
    this.escalar(this.porcentaje * Math.exp(-paso * .00165), this.punto(e), true);
  }

  @HostListener('pointerdown', ['$event']) abajo(e: PointerEvent) {
    if (e.button !== 0 || (!this.plano() && e.pointerType === 'touch')) return;
    const p = this.punto(e);
    if (!this.puntos.size) {
      this.inicio = p;
      this.movimiento = false;
    }
    this.puntos.set(e.pointerId, p);
  }

  @HostListener('pointermove', ['$event']) mover(e: PointerEvent) {
    const anterior = this.puntos.get(e.pointerId);
    if (!anterior) return;
    const p = this.punto(e);
    if (!this.movimiento && this.puntos.size === 1 && Math.hypot(p.x - this.inicio.x, p.y - this.inicio.y) < 5) return;
    if (!this.el.hasPointerCapture(e.pointerId)) this.el.setPointerCapture(e.pointerId);
    this.movimiento = true;
    this.el.classList.add('arrastrando');
    if (this.puntos.size > 1 && this.plano()) {
      const otro = [...this.puntos.entries()].find(([i]) => i !== e.pointerId)![1];
      const medio = (a: Punto) => ({ x: (a.x + otro.x) / 2, y: (a.y + otro.y) / 2 });
      const dist = (a: Punto) => Math.hypot(a.x - otro.x, a.y - otro.y);
      this.escalar(this.porcentaje * dist(p) / Math.max(1, dist(anterior)), medio(p), true, medio(anterior));
    } else if (this.plano()) {
      this.x += p.x - anterior.x; this.y += p.y - anterior.y; this.render();
    } else {
      this.el.scrollLeft += anterior.x - p.x;
      this.el.scrollTop += anterior.y - p.y;
    }
    this.puntos.set(e.pointerId, p);
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  @HostListener('lostpointercapture', ['$event'])
  arriba(e: PointerEvent) {
    this.puntos.delete(e.pointerId);
    if (!this.puntos.size) this.el.classList.remove('arrastrando');
  }

  @HostListener('pointerleave', ['$event']) salir(e: PointerEvent) {
    if (!this.el.hasPointerCapture(e.pointerId)) this.arriba(e);
  }

  @HostListener('keydown', ['$event']) teclas(e: KeyboardEvent) {
    if (!this.plano() || e.target !== this.el) return;
    const centro = { x: this.w / 2, y: this.h / 2 };
    switch (e.key) {
      case '+': case '=': this.escalar(this.porcentaje * 1.2, centro, true); break;
      case '-': this.escalar(this.porcentaje / 1.2, centro, true); break;
      case '0': this.escalar(100, centro, true); this.medir(); break;
      case 'ArrowLeft': this.x += 60; this.render(); break;
      case 'ArrowRight': this.x -= 60; this.render(); break;
      case 'ArrowUp': this.y += 60; this.render(); break;
      case 'ArrowDown': this.y -= 60; this.render(); break;
      default: return;
    }
    e.preventDefault();
  }
}
