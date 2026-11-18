import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { I18n } from './i18n';


const PEQUENOS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho',
  'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
  'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function cardinal(n: number): string {
  if (n < 30) return PEQUENOS[n];
  if (n < 100) return DECENAS[Math.floor(n / 10)] + (n % 10 ? ' y ' + cardinal(n % 10) : '');
  if (n === 100) return 'cien';
  if (n < 1000) return CENTENAS[Math.floor(n / 100)] + (n % 100 ? ' ' + cardinal(n % 100) : '');
  const escala = n < 1_000_000 ? 1000 : 1_000_000;
  const grupos = Math.floor(n / escala);
  const antes = cardinal(grupos).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
  const prefijo = escala === 1000 ? (grupos === 1 ? 'mil' : antes + ' mil')
    : (grupos === 1 ? 'un millón' : antes + ' millones');
  return prefijo + (n % escala ? ' ' + cardinal(n % escala) : '');
}

const UNIDADES: Record<string, [string, string]> = {
  km: ['kilómetro', 'kilómetros'], m: ['metro', 'metros'], cm: ['centímetro', 'centímetros'],
  mm: ['milímetro', 'milímetros'], kg: ['kilogramo', 'kilogramos'], g: ['gramo', 'gramos'],
  'km²': ['kilómetro cuadrado', 'kilómetros cuadrados'], 'm²': ['metro cuadrado', 'metros cuadrados'],
  'cm²': ['centímetro cuadrado', 'centímetros cuadrados'], 
  '°C': ['grado Celsius', 'grados Celsius'],
};

export function textoParaLectura(texto: string): string {
  return texto
    .replace(/\[\d+(?:\s*[,;–—-]\s*\d+)*\]/g, '')
    .replace(/\b(?:a\.\s*(?:de\s+)?C\.|aC\b)/giu, ' antes de Cristo')
    .replace(/\b(?:d\.\s*(?:de\s+)?C\.|dC\b)/giu, ' después de Cristo')
    .replace(/\b(?:a|d)\.\s*n\.\s*e\./gi, x => x[0].toLowerCase() === 'a' ? 'antes de nuestra era' : 'de nuestra era')
    .replace(/\bss\.\s*(?=[IVXLCDM]+\b)/g, 'siglos ')
    .replace(/\bs\.\s*(?=[IVXLCDM]+\b)/g, 'siglo ')
    .replace(/\bc\.\s*(?=\d)/gi, 'hacia ')
    .replace(/\bp\.\s*ej\./gi, 'por ejemplo')
    .replace(/\betc\./gi, 'etcétera.')
    .replace(/\bn[.º°]+\s*(?=\d)/gi, 'número ')
    .replace(/\b(?:cf|cfr)\./gi, 'compárese con')
    .replace(/\b(\d{1,3}(?:[.\u00a0\u202f ]\d{3}){1,3}|\d+(?:,\d+)?)\s*(km²|cm²|m²|km|cm|mm|kg|m|g|°C|%)(?![\p{L}\p{N}²])/gu,
      (_, cantidad: string, unidad: string) => cantidad + ' ' +
        (unidad === '%' ? 'por ciento' : UNIDADES[unidad][Number(cantidad.replace(',', '.')) === 1 ? 0 : 1]))
    .replace(/(?<![\d.])\d{1,3}(?:[.\u00a0\u202f ]\d{3}){1,3}(?!\d|[.,]\d)/gu, cifra => {
      const n = Number(cifra.replace(/[.\s]/g, ''));
      return n < 1_000_000_000 ? cardinal(n) : String(n);
    })
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOQUES = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd';
const CLAVE = 'relitree-lectura';
const AJUSTES = {
  velocidad: { min: 0.6, max: 1.8, paso: 0.1 },
  tono: { min: 0.5, max: 1.5, paso: 0.1 },
  volumen: { min: 0, max: 1, paso: 0.1 },
} as const;
type Ajuste = keyof typeof AJUSTES;
type Preferencias = Record<Ajuste, number> & { voz: string };
const inicial = { velocidad: 1, tono: 1, volumen: 1, voz: '' };

function preferencias(): Preferencias {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
    const resultado = { ...inicial, voz: typeof datos.voz === 'string' ? datos.voz : '' };
    for (const k of Object.keys(AJUSTES) as Ajuste[]) {
      const { min, max } = AJUSTES[k];
      if (typeof datos[k] === 'number' && datos[k] >= min && datos[k] <= max) resultado[k] = datos[k];
    }
    return resultado;
  } catch {
    return { ...inicial };
  }
}

/** Trocea por espacios para que los motores de voz procesen pasajes largos. */
function frases(texto: string): string[] {
  const partes: string[] = [];
  let resto = texto.replace(/\s+/g, ' ').trim();
  while (resto.length > 200) {
    const ventana = resto.slice(0, 201);
    const limites = [...ventana.matchAll(/[.!?…]\s/g)];
    const puntuacion = limites.at(-1)?.index;
    const espacio = ventana.lastIndexOf(' ');
    const corte = puntuacion !== undefined && puntuacion > 65 ? puntuacion + 1 : espacio > 0 ? espacio : 200;
    partes.push(resto.slice(0, corte));
    resto = resto.slice(corte).trimStart();
  }
  if (resto) partes.push(resto);
  return partes;
}

@Component({
  selector: 'app-lector-enciclopedia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'ajustes.set(false)' },
  template: `
    <div class="lector" [attr.data-estado]="estado()" role="group" [attr.aria-label]="i18n.t('leer')">
      <button type="button" [title]="i18n.t('lectorAnterior')" [attr.aria-label]="i18n.t('lectorAnterior')"
              [disabled]="!compatible || posicion() <= 0" (click)="salto(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M19 5 9 12l10 7z"/></svg>
      </button>
      <button type="button" class="lector-play" [title]="accion()" [attr.aria-label]="accion()"
              [disabled]="!compatible" (pointerdown)="recordarSeleccion()" (click)="alternar()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="estado() === 'leyendo'
          ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M8 5v14l11-7z'"/></svg>
      </button>
      <button type="button" [title]="i18n.t('lectorSiguiente')" [attr.aria-label]="i18n.t('lectorSiguiente')"
              [disabled]="!compatible || (total() > 0 && posicion() >= total() - 1)" (click)="salto(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M5 5l10 7-10 7z"/></svg>
      </button>
      <button type="button" [title]="i18n.t('lectorDetener')" [attr.aria-label]="i18n.t('lectorDetener')"
              [disabled]="estado() === 'inactivo'" (click)="detener()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/></svg>
      </button>
      <button type="button" [title]="i18n.t('lectorAjustes')" [attr.aria-label]="i18n.t('lectorAjustes')"
              [attr.aria-expanded]="ajustes()" aria-controls="lector-ajustes"
              [disabled]="!compatible" (click)="ajustes.set(!ajustes())">
        <svg class="lector-icono-ajustes" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10m4 0h2M4 17h4m4 0h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>
        </svg>
      </button>
      <div class="lector-progreso" aria-hidden="true" [style.width.%]="progreso()"></div>
      <span class="lector-aviso" role="status">{{ !compatible ? i18n.t('lectorNoDisponible') : error() ? i18n.t('lectorError') : '' }}</span>
      <div class="lector-ajustes" id="lector-ajustes" [hidden]="!ajustes()">
        <label>{{ i18n.t('lectorVoz') }}
          <select [value]="preferencia().voz" (change)="cambiarVoz($any($event.target).value)">
            <option value="" [selected]="!vozDisponible()">{{ i18n.t('lectorAutomatica') }}</option>
            @for (voz of voces(); track voz.voiceURI) {
              <option [value]="voz.voiceURI" [selected]="voz.voiceURI === preferencia().voz">{{ voz.name }} · {{ voz.lang }}</option>
            }
          </select>
        </label>
        @for (campo of campos; track campo.clave) {
          <label>
            <span>{{ i18n.t(campo.etiqueta) }} <output>{{ valor(campo.clave) }}</output></span>
            <input type="range" [min]="campo.min" [max]="campo.max" [step]="campo.paso"
                   [value]="preferencia()[campo.clave]" (change)="cambiar(campo.clave, $any($event.target).valueAsNumber)">
          </label>
        }
      </div>
    </div>
  `,
})
export class LectorEnciclopedia implements OnDestroy {
  readonly i18n = inject(I18n);
  readonly prosa = input<HTMLElement>();
  readonly articulo = input('');
  private readonly motor = typeof window !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'
    ? window.speechSynthesis : undefined;
  readonly compatible = !!this.motor;
  readonly preferencia = signal(preferencias());
  readonly ajustes = signal(false);
  readonly error = signal(false);
  readonly estado = signal<'inactivo' | 'leyendo' | 'pausa'>('inactivo');
  readonly posicion = signal(0);
  readonly total = signal(0);
  readonly voces = signal<SpeechSynthesisVoice[]>([]);
  readonly vozDisponible = computed(() => this.voces().some(v => v.voiceURI === this.preferencia().voz));
  readonly progreso = computed(() => this.estado() === 'inactivo' || !this.total() ? 0 : (this.posicion() + 1) / this.total() * 100);
  readonly accion = computed(() => this.i18n.t(this.estado() === 'leyendo' ? 'lectorPausa' : this.estado() === 'pausa' ? 'lectorContinuar' : 'leer'));
  readonly campos = [
    { clave: 'velocidad', etiqueta: 'lectorVelocidad', ...AJUSTES.velocidad },
    { clave: 'tono', etiqueta: 'lectorTono', ...AJUSTES.tono },
    { clave: 'volumen', etiqueta: 'lectorVolumen', ...AJUSTES.volumen },
  ] as const;
  private bloques: HTMLElement[] = [];
  private actual?: HTMLElement;
  private seleccion?: HTMLElement;
  private partes: string[] = [];
  private parte = 0;
  private turno = 0;
  private locucion?: SpeechSynthesisUtterance;
  private readonly refrescarVoces = () => {
    const voces = this.motor?.getVoices() ?? [];
    this.voces.set([...new Map(voces.map(v => [v.voiceURI, v])).values()]
      .sort((a, b) => Number(b.lang.startsWith('es')) - Number(a.lang.startsWith('es')) || a.name.localeCompare(b.name)));
  };

  constructor() {
    this.refrescarVoces();
    this.motor?.addEventListener('voiceschanged', this.refrescarVoces);
    effect(() => {
      this.articulo();
      this.prosa();
      this.detener();
      this.ajustes.set(false);
      this.error.set(false);
      this.bloques = [];
      this.total.set(0);
      this.seleccion = undefined;
    });
  }

  recordarSeleccion() {
    const seleccion = document.getSelection();
    const nodo = seleccion && !seleccion.isCollapsed ? seleccion.anchorNode : null;
    this.seleccion = nodo?.parentElement?.closest<HTMLElement>(BLOQUES) ?? undefined;
  }

  alternar() {
    if (!this.motor) return;
    if (this.estado() === 'leyendo') {
      this.estado.set('pausa');
      this.cancelarLocucion();
      return;
    }
    if (this.estado() === 'pausa') {
      this.estado.set('leyendo');
      this.leerParte();
      return;
    }
    const seleccion = this.seleccion;
    this.recordarSeleccion();
    const objetivo = this.seleccion ?? seleccion;
    this.seleccion = undefined;
    this.preparar();
    this.ir(Math.max(0, this.bloques.findIndex(b => b === objetivo || (!!objetivo && b.contains(objetivo)))), true);
  }

  salto(paso: number) {
    if (!this.bloques.length) this.preparar();
    this.ir(this.posicion() + paso, this.estado() !== 'pausa');
  }

  seleccionar(objetivo: Element) {
    if (this.estado() === 'inactivo' || document.getSelection()?.isCollapsed === false) return;
    const i = this.bloques.findIndex(b => b.contains(objetivo));
    if (i >= 0) this.ir(i, this.estado() === 'leyendo');
  }

  private preparar() {
    const prosa = this.prosa();
    const titulos = [...(prosa?.querySelectorAll<HTMLElement>('h2,h3,h4') ?? [])];
    const bibliografia = titulos.find(h => /^(fuentes|bibliografía|referencias)$/i.test(h.textContent?.trim() ?? ''));
    this.bloques = [...(prosa?.querySelectorAll<HTMLElement>(BLOQUES) ?? [])].filter(b =>
      b.innerText.trim() && !b.closest('figure, table, [hidden], details:not([open])') && !b.querySelector(BLOQUES) &&
      (!bibliografia || (b !== bibliografia && !(bibliografia.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING))));
    this.total.set(this.bloques.length);
  }

  private ir(indice: number, reproducir: boolean) {
    if (!this.motor || !this.bloques.length) return;
    this.cancelarLocucion();
    const i = Math.min(this.bloques.length - 1, Math.max(0, indice));
    this.posicion.set(i);
    this.error.set(false);
    this.estado.set(reproducir ? 'leyendo' : 'pausa');
    this.actual?.classList.remove('lector-parrafo');
    this.actual = this.bloques[i];
    this.actual.classList.add('lector-parrafo');
    this.actual.scrollIntoView({ block: 'center', behavior: 'instant' });
    const copia = this.actual.cloneNode(true) as HTMLElement;
    copia.querySelectorAll('.cita-fuente').forEach(cita => cita.remove());
    this.partes = frases(textoParaLectura(copia.textContent ?? ''));
    this.parte = 0;
    if (reproducir) this.leerParte();
  }

  private leerParte() {
    if (!this.motor) return;
    const texto = this.partes[this.parte];
    if (!texto) { this.detener(); return; }
    const p = this.preferencia();
    const voz = this.voces().find(v => v.voiceURI === p.voz)
      ?? this.voces().find(v => v.lang === 'es-ES') ?? this.voces().find(v => v.lang.startsWith('es'));
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = voz?.lang ?? 'es-ES';
    if (voz) u.voice = voz;
    u.rate = p.velocidad;
    u.pitch = p.tono;
    u.volume = p.volumen;
    this.locucion = u;
    const turno = this.turno;
    u.onend = () => {
      if (turno !== this.turno) return;
      this.locucion = undefined;
      this.parte++;
      if (this.parte < this.partes.length) this.leerParte();
      else if (this.posicion() + 1 < this.bloques.length) this.ir(this.posicion() + 1, true);
      else this.detener();
    };
    u.onerror = () => {
      if (turno !== this.turno) return;
      this.detener();
      this.error.set(true);
    };
    this.motor.speak(u);
  }

  private cancelarLocucion() {
    this.turno++;
    if (this.locucion) this.motor?.cancel();
    this.locucion = undefined;
  }

  detener() {
    this.cancelarLocucion();
    this.estado.set('inactivo');
    this.posicion.set(0);
    this.actual?.classList.remove('lector-parrafo');
    this.actual = undefined;
  }

  valor(clave: Ajuste) {
    const n = this.preferencia()[clave];
    return clave === 'volumen'
      ? Math.round(n * 100) + '%'
      : n.toLocaleString(this.i18n.idioma, { minimumFractionDigits: 1 }) + (clave === 'velocidad' ? '×' : '');
  }
  cambiar(clave: Ajuste, valor: number) {
    const { min, max } = AJUSTES[clave];
    if (Number.isFinite(valor) && valor >= min && valor <= max) this.guardar({ ...this.preferencia(), [clave]: valor });
  }
  cambiarVoz(voz: string) { this.guardar({ ...this.preferencia(), voz }); }
  private guardar(p: Preferencias) {
    this.preferencia.set(p);
    try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* La sesión conserva los ajustes. */ }
    if (this.estado() === 'leyendo') {
      this.cancelarLocucion();
      this.leerParte();
    }
  }

  ngOnDestroy() {
    this.motor?.removeEventListener('voiceschanged', this.refrescarVoces);
    this.detener();
  }
}
