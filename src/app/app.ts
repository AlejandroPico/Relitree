import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Datos, Religion } from './datos';
import { Estado } from './estado';
import { I18n } from './i18n';
import { GLIFOS, UI } from './glifos';
import { CSS_LIENZO, Lienzo } from './lienzo';
import { Enciclopedia } from './enciclopedia';

type Tema = 'dia' | 'tarde' | 'noche' | 'auto';
type Panel = 'buscar' | 'filtros' | 'leyenda' | 'tema' | 'acerca' | 'herramientas' | null;
const REPO = 'https://github.com/AlejandroPico/Relitree';
const PORTFOLIO = 'https://alejandropico.github.io/Portfolio/';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Lienzo, Enciclopedia],
  templateUrl: './app.html',
})
export class App {
  datos = inject(Datos); estado = inject(Estado); i18n = inject(I18n);
  ui = UI; glifos = GLIFOS; repo = REPO; portfolio = PORTFOLIO;
  editorWeb = 'https://alejandropico.github.io/Editor/'; editorRepo = 'https://github.com/AlejandroPico/Editor';
  temas: Tema[] = ['dia', 'tarde', 'noche', 'auto'];
  panel = signal<Panel>(null);
  tema = signal<Tema>(leer('relitree.tema') as Tema ?? 'auto');
  temaReal = signal<'dia' | 'tarde' | 'noche'>('noche');
  consulta = signal('');
  resultados = computed(() => this.datos.buscar(this.consulta()));
  instalable = signal<any>(null);
  private lienzo = viewChild(Lienzo);

  sel = computed(() => this.datos.porId.get(this.estado.seleccion() ?? '') ?? null);
  vinculos = computed(() => {
    const r = this.sel(); if (!r) return [];
    const d = this.datos, t = (k: string) => this.i18n.t(k);
    const it = (id: string, nota: string) => ({ r: d.porId.get(id)!, nota });
    return [
      { titulo: t('origen'), items: d.padres(r.id).map((x) => it(x.origen, t('r_' + x.clase))) },
      { titulo: t('recibe'), items: d.influenciasDe(r.id).map((x) => it(x.origen, '')) },
      { titulo: t('ramas'), items: d.hijas(r.id).map((x) => it(x.destino, this.i18n.anio(d.porId.get(x.destino)!.inicio))).sort((a, b) => a.r.inicio - b.r.inicio) },
      { titulo: t('influye'), items: d.influyeEn(r.id).map((x) => it(x.destino, '')) },
    ].filter((b) => b.items.length);
  });
  rel = computed(() => {
    const x = this.estado.relacion(); if (!x) return null;
    return { clase: x.clase, a: this.datos.porId.get(x.origen)!, b: this.datos.porId.get(x.destino)! };
  });

  constructor() {
    const estilo = document.createElement('style'); estilo.textContent = CSS_LIENZO; document.head.appendChild(estilo);
    this.datos.cargar();
    effect(() => {
      const t = this.tema(); guardar('relitree.tema', t);
      const real = t === 'auto' ? temaPorHora() : t;
      this.temaReal.set(real); document.documentElement.dataset['tema'] = real;
    });
    setInterval(() => { if (this.tema() === 'auto') { const r = temaPorHora(); this.temaReal.set(r); document.documentElement.dataset['tema'] = r; } }, 60000);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.instalable.set(e); });
  }

  abrir(p: Panel) { this.panel.set(this.panel() === p ? null : p); if (p === 'buscar') setTimeout(() => document.querySelector<HTMLInputElement>('.buscador input')?.focus()); }
  info(e: MouseEvent) { this.abrir(e.altKey ? 'herramientas' : 'acerca'); }
  ir(r: Religion) { this.panel.set(null); this.consulta.set(''); this.estado.elegir(r, true); }
  color(r: Religion) { return this.datos.region.get(r.region)!.color; }
  cambiarVista() { this.estado.elegir(null); this.estado.radial.update((v) => !v); }
  exportar() { this.lienzo()?.exportar(); }
  instalar() { this.instalable()?.prompt(); this.instalable.set(null); }
  wiki(r: Religion) { return `https://${this.i18n.idioma}.wikipedia.org/w/index.php?search=${encodeURIComponent(r.nombre)}`; }
  todos(conj: 'regionesOff' | 'tiposOff', ids: string[], ver: boolean) { this.estado[conj].set(new Set(ver ? [] : ids)); }
  idsRegiones() { return this.datos.regiones.map((r) => r.id); }
  idsTipos() { return [...this.datos.tipos.keys()]; }

  @HostListener('window:keydown', ['$event']) tecla(e: KeyboardEvent) {
    if (e.key === 'Escape') this.panel.set(null);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.abrir('buscar'); }
  }
}

function leer(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function guardar(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
/** Tema automático según fecha y hora locales: los días son más largos en verano. */
function temaPorHora(): 'dia' | 'tarde' | 'noche' {
  const ahora = new Date(), h = ahora.getHours() + ahora.getMinutes() / 60;
  const dia = Math.floor((+ahora - +new Date(ahora.getFullYear(), 0, 0)) / 864e5);
  const medio = 2.6 * Math.cos(((dia - 172) / 365) * 2 * Math.PI);      // ±2,6 h en torno al solsticio
  const amanece = 7.3 - medio / 2, anochece = 19.2 + medio / 2;
  return h >= amanece && h < anochece - 1.2 ? 'dia' : h >= anochece - 1.2 && h < anochece + 0.9 ? 'tarde' : 'noche';
}
