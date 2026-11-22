import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { Articulo, Datos, normalizar } from './datos';
import { Estado } from './estado';
import { LectorEnciclopedia } from './lector-enciclopedia';
import { BarraDesplazamiento } from './barra-desplazamiento';
import { I18n } from './i18n';
import { GLIFOS, UI } from './glifos';

interface SeccionArticulo {
  id: string;
  titulo: string;
  nivel: number;
  hijas: SeccionArticulo[];
}

interface EntradaIndice {
  articulo: Articulo;
  hijos: EntradaIndice[];
  categoria: boolean;
  abierto: boolean;
  total: number;
}

const CLAVE_LECTURA = 'relitree.ajustes-lectura';
const ANCHOS_LECTURA = { completa: 'none', estrecha: '38rem', media: '50rem', amplia: '66rem' } as const;
type AnchoLectura = keyof typeof ANCHOS_LECTURA;
const CONTROLES_LECTURA = [
  { campo: 'letra', etiqueta: 'lecturaLetra', min: 14, max: 32, paso: 1, unidad: 'px' },
  { campo: 'interlineado', etiqueta: 'lecturaInterlineado', min: 1.2, max: 2.3, paso: 0.1, unidad: '×' },
  { campo: 'parrafos', etiqueta: 'lecturaParrafos', min: 0, max: 40, paso: 2, unidad: 'px' },
] as const;
type CampoLectura = typeof CONTROLES_LECTURA[number]['campo'];
const LECTURA_INICIAL = { letra: 18, interlineado: 1.7, parrafos: 16, ancho: 'completa' as AnchoLectura };
type PreferenciasLectura = typeof LECTURA_INICIAL;

function esAnchoLectura(valor: unknown): valor is AnchoLectura {
  return typeof valor === 'string' && Object.hasOwn(ANCHOS_LECTURA, valor);
}

function leerPreferenciasLectura(): PreferenciasLectura {
  const ajustes = { ...LECTURA_INICIAL };
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE_LECTURA) ?? '{}') as Partial<PreferenciasLectura> | null;
    if (esAnchoLectura(guardados?.ancho)) ajustes.ancho = guardados.ancho;
    for (const { campo, min, max } of CONTROLES_LECTURA) {
      const valor = guardados?.[campo];
      if (typeof valor === 'number' && valor >= min && valor <= max) ajustes[campo] = valor;
    }
  } catch { /* Se puede leer con los valores iniciales. */ }
  return ajustes;
}

@Component({
  selector: 'app-enciclopedia',
  imports: [NgTemplateOutlet, LectorEnciclopedia, BarraDesplazamiento],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'cerrarAjustesFuera($event)',
    '(keydown.escape)': 'cerrarAjustesConEscape($event)',
  },
  template: `
    <section class="enciclopedia">
      <nav id="indice-enciclopedia" [class.indice-abierto]="indiceAbierto()">
        <button type="button" class="indice-movil" (click)="indiceAbierto.set(false)">{{ i18n.t('cerrar') }}</button>
        <input type="search" [placeholder]="i18n.t('filtrar')" [value]="filtro()" (input)="filtro.set($any($event.target).value)"/>
        <div class="orden">
          <button [class.activo]="!porTerritorio()" (click)="porTerritorio.set(false)">{{ i18n.t('ordenAZ') }}</button>
          <button [class.activo]="porTerritorio()" (click)="porTerritorio.set(true)">{{ i18n.t('ordenTerritorio') }}</button>
        </div>
        <div class="enc-con-desplazamiento enc-indice-desplazable">
        <div #indice class="indice" tabindex="0">
          @for (g of grupos(); track g.id) {
            <details [open]="g.abierto">
              <summary [style.color]="g.color">{{ g.nombre }}<small>{{ g.total }}</small></summary>
              <ng-container [ngTemplateOutlet]="rama" [ngTemplateOutletContext]="{ $implicit: g.entradas }"/>
            </details>
          }
        </div>
        <rel-barra-desplazamiento [contenido]="indice"/>
        </div>
      </nav>
      <ng-template #rama let-entradas>
        @for (entrada of entradas; track entrada.articulo.id) {
          @if (entrada.hijos.length || entrada.categoria) {
            <details class="rama-indice" [class.raiz-religion]="esReligion(entrada.articulo.id)"
                     [attr.id]="entrada.categoria ? entrada.articulo.id : null" [open]="entrada.abierto">
              <summary><span>{{ entrada.articulo.titulo }}</span></summary>
              <div class="subindice">
                @if (!entrada.categoria) {
                  <a href="#" [class.raiz-religion]="esReligion(entrada.articulo.id)" [class.activo]="entrada.articulo.id === estado.enciclopedia()" [attr.aria-current]="entrada.articulo.id === estado.enciclopedia() ? 'page' : null"
                     (click)="$event.preventDefault(); abrir(entrada.articulo.id)">{{ entrada.articulo.titulo }}</a>
                  @if (entrada.articulo.id === articulo()?.id) {
                    @if (indiceArticulo().length) {
                      <details class="indice-secciones">
                        <summary>{{ i18n.t('seccionesArticulo') }}</summary>
                        <ng-container [ngTemplateOutlet]="secciones" [ngTemplateOutletContext]="{ $implicit: indiceArticulo() }"/>
                      </details>
                    }
                  }
                }
                @if (entrada.categoria && !entrada.hijos.length) {
                  <p class="rama-pendiente">{{ i18n.t('articulosEnPreparacion') }}</p>
                }
                <ng-container [ngTemplateOutlet]="rama" [ngTemplateOutletContext]="{ $implicit: entrada.hijos }"/>
              </div>
            </details>
          } @else if (!entrada.categoria) {
            <a href="#" [class.activo]="entrada.articulo.id === estado.enciclopedia()" [attr.aria-current]="entrada.articulo.id === estado.enciclopedia() ? 'page' : null"
               (click)="$event.preventDefault(); abrir(entrada.articulo.id)">{{ entrada.articulo.titulo }}</a>
                  @if (entrada.articulo.id === articulo()?.id) {
                    @if (indiceArticulo().length) {
                      <details class="indice-secciones">
                        <summary>{{ i18n.t('seccionesArticulo') }}</summary>
                        <ng-container [ngTemplateOutlet]="secciones" [ngTemplateOutletContext]="{ $implicit: indiceArticulo() }"/>
                      </details>
                    }
                  }
          }
        }
      </ng-template>
      <ng-template #secciones let-grupo>
        @if (grupo.length) {
          <ul class="indice-articulo">
            @for (seccion of grupo; track seccion.id) {
              <li>
                <div class="fila-seccion">
                  @if (seccion.hijas.length) {
                    <button type="button" class="desplegar-seccion"
                            [attr.aria-label]="seccion.titulo"
                            [attr.aria-expanded]="seccionesAbiertas().has(seccion.id)"
                            [attr.aria-controls]="'indice-seccion-' + seccion.id"
                            (click)="alternarSeccion(seccion.id)">
                      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 4 4-4 4"/></svg>
                    </button>
                  }
                  <a [attr.href]="'#' + seccion.id" [class.activo]="seccionActiva() === seccion.id"
                     [attr.aria-current]="seccionActiva() === seccion.id ? 'location' : null"
                     (click)="$event.preventDefault(); irASeccion(seccion.id)">{{ seccion.titulo }}</a>
                </div>
                @if (seccion.hijas.length) {
                  <div [attr.id]="'indice-seccion-' + seccion.id" [hidden]="!seccionesAbiertas().has(seccion.id)">
                    @if (seccionesAbiertas().has(seccion.id)) {
                      <ng-container [ngTemplateOutlet]="secciones" [ngTemplateOutletContext]="{ $implicit: seccion.hijas }"/>
                    }
                  </div>
                }
              </li>
            }
          </ul>
        }
      </ng-template>
      <div class="enc-con-desplazamiento">
      <article #cuerpo tabindex="0" (scroll)="guardarPosicion()" (click)="clic($event)">
        <header>
          <div class="enc-cabecera-indice">
          <button type="button" class="ico" [title]="etiquetaVolver()" [attr.aria-label]="etiquetaVolver()"
                  (click)="estado.volverArticulo()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h13"/></svg>
          </button>
          <button type="button" class="indice-movil" aria-controls="indice-enciclopedia"
                  [attr.aria-expanded]="indiceAbierto()" (click)="indiceAbierto.set(!indiceAbierto())">
            {{ i18n.t('indiceEnciclopedia') }}
          </button>
          </div>
          @if (articulo(); as a) {
            <app-lector-enciclopedia [articulo]="a.id" [prosa]="prosa()?.nativeElement"/>
          }
          <div class="enc-cabecera-acciones">
          @if (religion(); as r) {
            <button class="ico" [title]="i18n.t('verArbol')" (click)="verEnArbol(r.id)"><svg viewBox="0 0 24 24"><path [attr.d]="ui['diana']"/></svg></button>
          }
          @if (articulo()) {
            <div #ajustesLectura class="enc-ajustes-lectura">
              <button #botonLectura type="button" class="ico" [class.activo]="ajustesLecturaAbiertos()"
                      [title]="i18n.t('lecturaAjustes')" [attr.aria-label]="i18n.t('lecturaAjustes')"
                      [attr.aria-controls]="ajustesLecturaAbiertos() ? 'ajustes-texto-enciclopedia' : null"
                      [attr.aria-expanded]="ajustesLecturaAbiertos()"
                      (click)="ajustesLecturaAbiertos.set(!ajustesLecturaAbiertos())">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18L8 5l5 13M5 13h6m4-2c1-2 5-2 5 1v6m0-4h-2c-4 0-4 4-1 4 1.5 0 2.5-.5 3-1.5"/></svg>
              </button>
              @if (ajustesLecturaAbiertos()) {
                <div class="enc-panel-lectura" id="ajustes-texto-enciclopedia" role="group" [attr.aria-label]="i18n.t('lecturaAjustes')">
                  @for (control of controlesLectura; track control.campo) {
                    <label>
                      <span>{{ i18n.t(control.etiqueta) }} <output>{{ valorLectura(control.campo) }} {{ control.unidad }}</output></span>
                      <input type="range" [min]="control.min" [max]="control.max" [step]="control.paso"
                             [value]="preferenciasLectura()[control.campo]"
                             (input)="ajustarLectura(control.campo, $any($event.target).valueAsNumber)">
                    </label>
                  }
                  <label>
                    <span>{{ i18n.t('lecturaAncho') }}</span>
                    <select [value]="preferenciasLectura().ancho" (change)="ajustarAnchoLectura($any($event.target).value)">
                      <option value="completa">{{ i18n.t('lecturaCompleta') }}</option>
                      <option value="estrecha">{{ i18n.t('lecturaEstrecha') }}</option>
                      <option value="media">{{ i18n.t('lecturaMedia') }}</option>
                      <option value="amplia">{{ i18n.t('lecturaAmplia') }}</option>
                    </select>
                  </label>
                  <button type="button" class="enc-restablecer-lectura"
                          (click)="guardarPreferenciasLectura(lecturaInicial)">{{ i18n.t('lecturaRestablecer') }}</button>
                </div>
              }
            </div>
          }
          <button class="ico" [title]="i18n.t('cerrar')" (click)="cerrar()"><svg viewBox="0 0 24 24"><path [attr.d]="ui['cerrar']"/></svg></button>
          </div>
        </header>
        @if (articulo(); as a) {
          <div class="texto"
               [style.--enc-ancho-lectura]="anchoLectura()"
               [style.--enc-letra-lectura]="preferenciasLectura().letra + 'px'"
               [style.--enc-interlineado]="preferenciasLectura().interlineado"
               [style.--enc-espacio-parrafos]="preferenciasLectura().parrafos + 'px'">
            @if (religion(); as r) {
              <div class="cabecera">
                <svg class="simbolo" viewBox="-20 -20 40 40" [style.color]="color(r.region)" [class.heredado]="r.heredado">
                  <circle r="18"/>
                  @if (r.icono) { <image [attr.href]="r.icono" [attr.x]="r.heredado ? -8 : -11.5" [attr.y]="r.heredado ? -8 : -11.5" [attr.width]="r.heredado ? 16 : 23" [attr.height]="r.heredado ? 16 : 23"/> }
                  @else { <path [attr.d]="glifos[r.tipo].d" [class.relleno]="glifos[r.tipo].relleno"/> }
                </svg>
                <div>
                  <h1>{{ a.titulo }}</h1>
                  <p class="datos">{{ datos.tipos.get(r.tipo) }} · {{ datos.region.get(r.region)!.nombre }} · {{ i18n.periodo(r.inicio, r.fin) }}@if (r.fieles) { · {{ i18n.cantidad(r.fieles, r.fielesMax) }} {{ i18n.t('fieles').toLowerCase() }} }</p>
                </div>
              </div>
            } @else { <h1>{{ a.titulo }}</h1> }
            @if (ruta().length) {
              <div class="datos volver ruta-articulo" role="navigation" [attr.aria-label]="i18n.t('parteDe')">
                <span>{{ i18n.t('parteDe') }}</span>
                @for (nivel of ruta(); track nivel.id) {
                  @if (!$first) { <span aria-hidden="true">›</span> }
                  @if (nivel.id.startsWith('categoria:')) {
                    <a [attr.href]="'#' + nivel.id" (click)="$event.preventDefault(); verCategoria(nivel.id)">{{ nivel.titulo }}</a>
                  } @else {
                    <a href="#" [attr.data-ir]="nivel.id">{{ nivel.titulo }}</a>
                  }
                }
              </div>
            }
            <div #prosa class="prosa" [innerHTML]="html()"></div>
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
              @if (r.credito; as c) {
                @if (c.fuente === 'propio') { <p class="credito">{{ i18n.t('creditoIcono') }}: {{ i18n.t('simboloPropio') }} {{ c.motivo }}.</p> }
                @else { <p class="credito">{{ i18n.t('creditoIcono') }}: {{ c.autor }} · {{ c.licencia }} · <a [href]="c.fuente" target="_blank" rel="noopener">Wikimedia Commons</a></p> }
              }
              @if (r.heredado) { <p class="credito">{{ i18n.t('simboloHeredado') }}.</p> }
            }
          </div>
        } @else {
          <div class="texto">
            <h1>{{ tituloPendiente() || i18n.t('articuloPendiente') }}</h1>
            @if (tituloPendiente()) { <p>{{ i18n.t('articuloPendiente') }}</p> }

          </div>
        }
      </article>
      <rel-barra-desplazamiento [contenido]="cuerpo"/>
      </div>
    </section>`,
})
export class Enciclopedia {
  datos = inject(Datos); estado = inject(Estado); i18n = inject(I18n);
  private san = inject(DomSanitizer);
  ui = UI; glifos = GLIFOS;
  filtro = signal('');
  indiceAbierto = signal(false);
  porTerritorio = signal(false);
  readonly tituloPendiente = computed(() => this.estado.visitaEnciclopedia()?.titulo ?? '');
  readonly etiquetaVolver = computed(() => this.i18n.t(
    (this.estado.visitaEnciclopedia()?.profundidad ?? 0) > 1 ? 'volverArticulo' : 'verArbol',
  ));
  private claveMostrada: string | null = null;
  readonly ajustesLecturaAbiertos = signal(false);
  readonly preferenciasLectura = signal(leerPreferenciasLectura());
  readonly anchoLectura = computed(() => ANCHOS_LECTURA[this.preferenciasLectura().ancho]);
  readonly controlesLectura = CONTROLES_LECTURA;
  readonly lecturaInicial = LECTURA_INICIAL;
  private ajustesLectura = viewChild<ElementRef<HTMLElement>>('ajustesLectura');
  private botonLectura = viewChild<ElementRef<HTMLButtonElement>>('botonLectura');
  prosa = viewChild<ElementRef<HTMLElement>>('prosa');
  private lector = viewChild(LectorEnciclopedia);
  private cuerpo = viewChild.required<ElementRef<HTMLElement>>('cuerpo');
  private indice = viewChild.required<ElementRef<HTMLElement>>('indice');

  articulo = computed(() => { const id = this.estado.enciclopedia(); return id ? this.datos.articulo(id) : null; });
  religion = computed(() => this.datos.porId.get(this.estado.enciclopedia() ?? '') ?? null);
  readonly seccionActiva = signal('');
  readonly seccionesAbiertas = signal<ReadonlySet<string>>(new Set());
  readonly ruta = computed(() => {
    const resultado: Articulo[] = [];
    let id = this.articulo()?.padre;
    while (id && !resultado.some(a => a.id === id)) {
      const nivel = this.datos.indice.find(a => a.id === id);
      if (!nivel) break;
      resultado.unshift(nivel);
      id = nivel.padre;
    }
    return resultado;
  });
  readonly indiceArticulo = computed(() => {
    const html = this.articulo()?.html;
    if (!html) return [];
    const plantilla = document.createElement('template');
    plantilla.innerHTML = html;
    const raiz: SeccionArticulo[] = [];
    const padres: SeccionArticulo[] = [];
    for (const h of plantilla.content.querySelectorAll<HTMLElement>('h2[id],h3[id],h4[id],h5[id],h6[id]')) {
      const titulo = h.textContent?.trim();
      if (!titulo) continue;
      const seccion = { id: h.id, titulo, nivel: Number(h.tagName[1]), hijas: [] };
      while (padres.length && padres[padres.length - 1].nivel >= seccion.nivel) padres.pop();
      (padres.at(-1)?.hijas ?? raiz).push(seccion);
      padres.push(seccion);
    }
    return raiz;
  });
  html = computed(() => this.san.bypassSecurityTrustHtml(this.articulo()?.html ?? ''));   // HTML generado por nuestro propio backend
  /** Subartículos de desarrollo del artículo abierto (o sus hermanos, si se está leyendo uno). */
  desarrollo = computed(() => {
    const a = this.articulo(); if (!a) return [];
    const raiz = a.padre ?? a.id;
    return this.datos.indice.filter((x) => x.padre === raiz && !x.id.startsWith('categoria:') && !x.destino_indice);
  });
  grupos = computed(() => {
    const q = normalizar(this.filtro().trim());
    const actual = this.articulo();
    const porPadre = new Map<string | null, Articulo[]>();
    for (const articulo of this.datos.indice) {
      const hijos = porPadre.get(articulo.padre) ?? [];
      hijos.push(articulo);
      porPadre.set(articulo.padre, hijos);
    }
    const entrada = (articulo: Articulo, coincideRama = false): EntradaIndice | null => {
      const categoria = articulo.id.startsWith('categoria:');
      const coincide = coincideRama || !q || normalizar(articulo.titulo).includes(q);
      const hijosDirectos = porPadre.get(articulo.id) ?? [];
      const hijos = hijosDirectos
        .map((hijo) => entrada(hijo, coincide))
        .filter((hijo): hijo is EntradaIndice => hijo !== null);
      if (!hijos.length && (!coincide || (categoria && hijosDirectos.length))) return null;
      const abierto = !!q || actual?.id === articulo.id || hijos.some((hijo) => hijo.abierto);
      const total = hijos.reduce((suma, hijo) => suma + hijo.total, categoria || articulo.destino_indice ? 0 : 1);
      return { articulo, hijos, categoria, abierto, total };
    };
    const raices = (porPadre.get(null) ?? []).map((articulo) => entrada(articulo))
      .filter((raiz): raiz is EntradaIndice => raiz !== null);
    const grupo = (id: string, nombre: string, color: string, abierto: boolean) => {
      const entradas = raices.filter(({ articulo }) => id === 'todas' ? articulo.grupo !== 'tema' : articulo.grupo === id);
      const total = entradas.reduce((suma, raiz) => suma + raiz.total, 0);
      return { id, nombre, color, entradas, total, abierto: abierto || !!q };
    };
    const temas = grupo('tema', this.i18n.t('temas'), 'var(--acento)', true);
    const resto = this.porTerritorio()
      ? this.datos.regiones.map((r) => grupo(r.id, r.nombre, r.color, actual?.grupo === r.id))
      : [grupo('todas', this.i18n.t('religiones'), 'var(--tenue)', true)];
    return [temas, ...resto].filter((g) => g.entradas.length);
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

  constructor() {
    effect(() => {
      this.estado.visitaEnciclopedia();
      this.indiceAbierto.set(false);
      this.ajustesLecturaAbiertos.set(false);
      this.seccionActiva.set('');
      this.seccionesAbiertas.set(new Set());
    });
    afterRenderEffect(() => {
      const visita = this.estado.visitaEnciclopedia();
      const cuerpo = this.cuerpo().nativeElement;
      if (!visita || visita.clave === this.claveMostrada) return;
      this.claveMostrada = visita.clave;
      cuerpo.scrollTop = this.estado.posicionesEnciclopedia.get(visita.clave) ?? 0;
    });
    afterRenderEffect(() => {
      const grupos = this.grupos();
      this.indiceAbierto(); // En móvil el índice se despliega después de abrir el artículo.
      const indice = this.indice().nativeElement;
      if (!grupos.length || !indice.clientHeight) return;
      const activo = indice.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!activo) return;
      for (let rama = activo.closest('details'); rama; rama = rama.parentElement?.closest('details') ?? null) {
        rama.open = true;
      }
      const vista = indice.getBoundingClientRect();
      const fila = activo.getBoundingClientRect();
      if (fila.top < vista.top || fila.bottom > vista.bottom) {
        indice.scrollTop += (fila.top + fila.bottom - vista.top - vista.bottom) / 2;
      }
    });
  }

  valorLectura(campo: CampoLectura): string {
    return this.preferenciasLectura()[campo].toLocaleString(this.i18n.idioma);
  }

  guardarPreferenciasLectura(preferencias: PreferenciasLectura) {
    this.preferenciasLectura.set(preferencias);
    try { localStorage.setItem(CLAVE_LECTURA, JSON.stringify(preferencias)); } catch { /* Conserva la vista en esta sesión. */ }
  }

  ajustarLectura(campo: CampoLectura, valor: number) {
    this.guardarPreferenciasLectura({ ...this.preferenciasLectura(), [campo]: valor });
  }

  ajustarAnchoLectura(valor: string) {
    if (esAnchoLectura(valor)) this.guardarPreferenciasLectura({ ...this.preferenciasLectura(), ancho: valor });
  }

  cerrarAjustesFuera(evento: MouseEvent) {
    if (!this.ajustesLecturaAbiertos() || !(evento.target instanceof Node)) return;
    if (!this.ajustesLectura()?.nativeElement.contains(evento.target)) this.ajustesLecturaAbiertos.set(false);
  }

  cerrarAjustesConEscape(evento: Event) {
    if (!this.ajustesLecturaAbiertos()) return;
    evento.stopPropagation();
    this.ajustesLecturaAbiertos.set(false);
    this.botonLectura()?.nativeElement.focus();
  }

  color(region: string) { return this.datos.region.get(region)!.color; }
  abrir(id: string, titulo = '') {
    this.guardarPosicion();
    this.estado.abrirArticulo(id, titulo);
    this.indiceAbierto.set(false);
  }

  guardarPosicion() {
    if (this.claveMostrada && this.claveMostrada === this.estado.visitaEnciclopedia()?.clave) {
      this.estado.posicionesEnciclopedia.set(this.claveMostrada, this.cuerpo().nativeElement.scrollTop);
    }
  }

  cerrar() {
    this.guardarPosicion();
    this.estado.cerrarEnciclopedia();
  }

  verEnArbol(id: string) { this.cerrar(); this.estado.elegir(id, true); }
  esReligion(id: string) { return this.datos.porId.has(id); }

  alternarSeccion(id: string) {
    this.seccionesAbiertas.update(abiertas => {
      const siguientes = new Set(abiertas);
      if (!siguientes.delete(id)) siguientes.add(id);
      return siguientes;
    });
  }

  irASeccion(id: string) {
    const destino = this.prosa()?.nativeElement.querySelector<HTMLElement>('#' + CSS.escape(id));
    if (!destino) return;
    this.indiceAbierto.set(false);
    this.seccionActiva.set(id);
    this.enfocar(destino);
  }

  verCategoria(id: string) {
    const destino = document.getElementById(id);
    if (!(destino instanceof HTMLDetailsElement)) return;
    for (let detalle: HTMLDetailsElement | null = destino; detalle; detalle = detalle.parentElement?.closest('details') ?? null) {
      detalle.open = true;
    }
    this.indiceAbierto.set(true);
    requestAnimationFrame(() => destino.scrollIntoView({ block: 'nearest' }));
  }

  private enfocar(destino: HTMLElement) {
    destino.tabIndex = -1;
    destino.scrollIntoView({ block: 'start' });
    destino.focus({ preventScroll: true });
  }

  private mostrarFuentes(cita: HTMLElement) {
    const prosa = this.prosa()?.nativeElement;
    if (!prosa) return;
    prosa.querySelectorAll('.fuente-resaltada').forEach(el => el.classList.remove('fuente-resaltada'));
    const fuentes = (cita.dataset['fuentes'] ?? '').split(' ')
      .map(id => id ? prosa.querySelector<HTMLElement>('#' + CSS.escape(id))?.closest('li') : null)
      .filter((li): li is HTMLLIElement => !!li);
    fuentes.forEach(li => li.classList.add('fuente-resaltada'));
    if (fuentes[0]) this.enfocar(fuentes[0]);
  }

  clic(e: Event) {
    const objetivo = e.target;
    if (!(objetivo instanceof Element)) return;
    const a = objetivo.closest('a');
    if (a?.hasAttribute('data-fuentes')) { e.preventDefault(); this.mostrarFuentes(a); }
    else if (a?.hasAttribute('data-ir')) { e.preventDefault(); this.abrir(a.getAttribute('data-ir')!, a.textContent?.trim()); }
    else if (!a && this.prosa()?.nativeElement.contains(objetivo)) this.lector()?.seleccionar(objetivo);
  }
}
