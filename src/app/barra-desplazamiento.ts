import { ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, viewChild } from '@angular/core';

@Component({
  selector: 'rel-barra-desplazamiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div #cursor class="enc-cursor-scroll" aria-hidden="true" (pointerdown)="agarrar($event)" (pointermove)="arrastrar($event)" (lostpointercapture)="soltar()"></div>',
})
export class BarraDesplazamiento {
  readonly contenido = input.required<HTMLElement>();
  private readonly cursor = viewChild.required<ElementRef<HTMLElement>>('cursor');
  private arrastre?: { id: number; y: number; inicio: number; proporcion: number };
  private temporizador = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
    effect(limpiar => {
      const contenido = this.contenido();
      const cursor = this.cursor().nativeElement;
      const ajustar = () => this.medir(contenido, cursor);
      const mostrar = () => {
        if (!ajustar()) return;
        cursor.classList.add('visible');
        this.programarOcultacion(cursor);
      };
      const observador = new ResizeObserver(ajustar);
      observador.observe(contenido);
      contenido.addEventListener('scroll', mostrar, { passive: true });
      contenido.addEventListener('toggle', ajustar, true);
      contenido.addEventListener('load', ajustar, true);
      limpiar(() => {
        observador.disconnect();
        contenido.removeEventListener('scroll', mostrar);
        contenido.removeEventListener('toggle', ajustar, true);
        contenido.removeEventListener('load', ajustar, true);
      });
    });
  }

  private medir(contenido: HTMLElement, cursor: HTMLElement) {
    const alto = contenido.clientHeight;
    const recorrido = contenido.scrollHeight - alto;
    if (!alto || recorrido <= 1) {
      cursor.classList.remove('visible');
      return null;
    }

    const pista = Math.max(1, alto - 8);
    const longitud = Math.min(pista, Math.max(24, pista * alto / contenido.scrollHeight));
    const margen = pista - longitud;
    const avance = Math.max(0, Math.min(1, contenido.scrollTop / recorrido));
    cursor.style.height = longitud + 'px';
    cursor.style.transform = 'translateY(' + avance * margen + 'px)';
    return margen > 0 ? recorrido / margen : null;
  }

  private programarOcultacion(cursor: HTMLElement) {
    clearTimeout(this.temporizador);
    if (!this.arrastre) {
      this.temporizador = window.setTimeout(() => cursor.classList.remove('visible'), 1800);
    }
  }

  agarrar(evento: PointerEvent) {
    if (evento.button !== 0 || this.arrastre) return;
    const cursor = this.cursor().nativeElement;
    const contenido = this.contenido();
    const proporcion = this.medir(contenido, cursor);
    if (!proporcion) return;
    evento.preventDefault();
    cursor.setPointerCapture(evento.pointerId);
    this.arrastre = { id: evento.pointerId, y: evento.clientY, inicio: contenido.scrollTop, proporcion };
    clearTimeout(this.temporizador);
  }

  arrastrar(evento: PointerEvent) {
    const a = this.arrastre;
    if (a?.id === evento.pointerId) {
      this.contenido().scrollTop = a.inicio + (evento.clientY - a.y) * a.proporcion;
    }
  }

  soltar() {
    this.arrastre = undefined;
    this.programarOcultacion(this.cursor().nativeElement);
  }
}
