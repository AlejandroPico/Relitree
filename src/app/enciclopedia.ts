import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Articulo, Datos, normalizar } from './datos';
import { Estado } from './estado';
import { I18n } from './i18n';
import { GLIFOS, UI } from './glifos';

@Component({
  selector: 'app-enciclopedia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="enciclopedia">
      <nav>
        <input type="search" [placeholder]="i18n.t('filtrar')" [value]="filtro()" (input)="filtro.set($any($event.target).value)"/>
        <div class="orden">
          <button [class.activo]="!porTerritorio()" (click)="porTerritorio.set(false)">{{ i18n.t('ordenAZ') }}</button>
          <button [class.activo]="porTerritorio()" (click)="porTerritorio.set(true)">{{ i18n.t('ordenTerritorio') }}</button>
        </div>
        <div class="indice">
          @for (g of grupos(); track g.id) {
            <details [open]="g.abierto">
              <summary [style.color]="g.color">{{ g.nombre }}<small>{{ g.total }}</small></summary>
              @for (a of g.articulos; track a.id) {
                <a [class.activo]="a.id === estado.enciclopedia()" [class.sub]="a.padre" (click)="abrir(a.id)">{{ a.titulo }}</a>
              }
            </details>
          }
        </div>
      </nav>
      <article #cuerpo (click)="clic($event)">
        <header>
          <button class="ico" [title]="i18n.t('leer')" (click)="leer()"><svg viewBox="0 0 24 24"><path [attr.d]="hablando() ? ui['parar'] : ui['altavoz']"/></svg></button>
          @if (religion(); as r) {
            <button class="ico" [title]="i18n.t('verArbol')" (click)="verEnArbol(r.id)"><svg viewBox="0 0 24 24"><path [attr.d]="ui['diana']"/></svg></button>
          }
          <button class="ico" [title]="i18n.t('cerrar')" (click)="cerrar()"><svg viewBox="0 0 24 24"><path [attr.d]="ui['cerrar']"/></svg></button>
        </header>
        @if (articulo(); as a) {
          <div class="texto">
            @if (religion(); as r) {
              <div class="cabecera">
                <svg class="simbolo" viewBox="-20 -20 40 40" [style.color]="color(r.region)">
                  <circle r="18"/>
                  @if (r.icono) { <image [attr.href]="r.icono" x="-11.5" y="-11.5" width="23" height="23"/> }
                  @else { <path [attr.d]="glifos[r.tipo].d" [class.relleno]="glifos[r.tipo].relleno"/> }
                </svg>
                <div>
                  <h1>{{ a.titulo }}</h1>
                  <p class="datos">{{ datos.tipos.get(r.tipo) }} · {{ datos.region.get(r.region)!.nombre }} · {{ i18n.periodo(r.inicio, r.fin) }}</p>
                </div>
              </div>
            } @else { <h1>{{ a.titulo }}</h1> }
            @if (padre(); as p) { <p class="datos volver">{{ i18n.t('parteDe') }} <a [attr.data-ir]="p.id">{{ p.titulo }}</a></p> }
            <div class="prosa" [innerHTML]="html()"></div>
            @if (desarrollo().length) {
              <h2>{{ i18n.t('desarrollo') }}</h2>
              <p class="enlaces">@for (d of desarrollo(); track d.id) { <a [attr.data-ir]="d.id">{{ d.titulo }}</a> }</p>
            }
            @if (religion(); as r) {
              @for (b of bloques(); track b.titulo) {
                <h2>{{ b.titulo }}</h2>
                <p class="enlaces">
                  @for (e of b.items; track e.id) { <a [attr.data-ir]="e.id">{{ e.nombre }}<small>{{ e.nota }}</small></a> }
                </p>
              }
              @if (r.credito; as c) { <p class="credito">{{ i18n.t('creditoIcono') }}: {{ c.autor }} · {{ c.licencia }} · <a [href]="c.fuente" target="_blank" rel="noopener">Wikimedia Commons</a></p> }
            }
          </div>
        }
      </article>
    </section>`,
})
export class Enciclopedia implements OnDestroy {
  datos = inject(Datos); estado = inject(Estado); i18n = inject(I18n);
  private san = inject(DomSanitizer);
  ui = UI; glifos = GLIFOS;
  filtro = signal('');
  porTerritorio = signal(false);
  hablando = signal(false);
  private cuerpo = viewChild.required<ElementRef<HTMLElement>>('cuerpo');

  articulo = computed(() => { const id = this.estado.enciclopedia(); return id ? this.datos.articulo(id) : null; });
  religion = computed(() => this.datos.porId.get(this.estado.enciclopedia() ?? '') ?? null);
  padre = computed(() => { const p = this.articulo()?.padre; return p ? this.datos.indice.find((a) => a.id === p) ?? null : null; });
  html = computed(() => this.san.bypassSecurityTrustHtml(this.articulo()?.html ?? ''));   // HTML generado por nuestro propio backend
  /** Subartículos de desarrollo del artículo abierto (o sus hermanos, si se está leyendo uno). */
  desarrollo = computed(() => {
    const a = this.articulo(); if (!a) return [];
    const raiz = a.padre ?? a.id;
    return this.datos.indice.filter((x) => x.padre === raiz);
  });
  grupos = computed(() => {
    const q = normalizar(this.filtro()), actual = this.articulo();
    const pasa = (t: string) => !q || normalizar(t).includes(q);
    // cada artículo principal seguido de sus subartículos
    const ordenar = (lista: Articulo[]) => lista.filter((a) => !a.padre).flatMap((a) => [a, ...lista.filter((x) => x.padre === a.id)]);
    const de = (grupo: string | null) => ordenar(this.datos.indice.filter((a) => (grupo ? a.grupo === grupo : a.grupo !== 'tema'))).filter((a) => pasa(a.titulo));
    const g = (id: string, nombre: string, color: string, articulos: Articulo[], abierto: boolean) => ({ id, nombre, color, articulos, total: articulos.length, abierto: abierto || !!q });
    const temas = g('tema', this.i18n.t('temas'), 'var(--acento)', this.datos.indice.filter((a) => a.grupo === 'tema' && pasa(a.titulo)), true);
    const resto = this.porTerritorio()
      ? this.datos.regiones.map((r) => g(r.id, r.nombre, r.color, de(r.id), actual?.grupo === r.id))
      : [g('todas', this.i18n.t('religiones'), 'var(--tenue)', de(null), true)];
    return [temas, ...resto].filter((x) => x.total);
  });
  bloques = computed(() => {
    const r = this.religion(); if (!r) return [];
    const d = this.datos, t = (k: string) => this.i18n.t(k);
    const item = (id: string, clase?: string) => { const o = d.porId.get(id)!; return { id, nombre: o.nombre, nota: clase ? t('r_' + clase) : this.i18n.anio(o.inicio) }; };
    return [
      { titulo: t('origen'), items: d.padres(r.id).map((x) => item(x.origen, x.clase)) },
      { titulo: t('recibe'), items: d.influenciasDe(r.id).map((x) => item(x.origen)) },
      { titulo: t('ramas'), items: d.hijas(r.id).map((x) => item(x.destino)).sort((a, b) => d.porId.get(a.id)!.inicio - d.porId.get(b.id)!.inicio) },
      { titulo: t('influye'), items: d.influyeEn(r.id).map((x) => item(x.destino)) },
    ].filter((b) => b.items.length);
  });

  color(region: string) { return this.datos.region.get(region)!.color; }
  abrir(id: string) { this.parar(); this.estado.enciclopedia.set(id); this.cuerpo().nativeElement.scrollTop = 0; }
  cerrar() { this.parar(); this.estado.enciclopedia.set(null); }
  verEnArbol(id: string) { this.cerrar(); this.estado.elegir(id, true); }
  clic(e: Event) {
    const a = (e.target as HTMLElement).closest('a[data-ir]');
    if (a) { e.preventDefault(); this.abrir(a.getAttribute('data-ir')!); }
  }
  /** Lectura en voz alta: todo el artículo, o desde el texto seleccionado si lo hay. */
  leer() {
    if (this.hablando()) return this.parar();
    const texto = (this.cuerpo().nativeElement.querySelector('.texto') as HTMLElement)?.innerText ?? '';
    const sel = String(window.getSelection() ?? '').trim();
    const desde = sel ? Math.max(0, texto.indexOf(sel.slice(0, 40))) : 0;
    const voz = new SpeechSynthesisUtterance(texto.slice(desde));
    voz.lang = 'es-ES';
    voz.onend = voz.onerror = () => this.hablando.set(false);
    speechSynthesis.cancel(); speechSynthesis.speak(voz); this.hablando.set(true);
  }
  parar() { speechSynthesis.cancel(); this.hablando.set(false); }
  ngOnDestroy() { this.parar(); }
}
