import { Injectable } from '@angular/core';

/**
 * Textos de interfaz. No hay cadenas en el código: todas viven en i18n/<idioma>/interfaz.json,
 * el backend las vuelca en la SQLite y aquí se cargan (idioma del sistema sobre el idioma base).
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  idioma = 'es';
  private textos: Record<string, string> = {};

  /** Elige el idioma del sistema si está disponible; si no, el idioma base. */
  elegir(disponibles: string[], base: string): string {
    const nav = (navigator.language || base).toLowerCase();
    this.idioma = disponibles.find((i) => nav.startsWith(i)) ?? base;
    document.documentElement.lang = this.idioma;
    return this.idioma;
  }
  cargar(textos: Record<string, string>) { this.textos = textos; }
  t(clave: string): string { return this.textos[clave] ?? clave; }

  anio(a: number): string {
    const abs = Math.abs(a).toLocaleString(this.idioma);
    return a < 0 ? `${abs} ${this.t('ac')}` : String(a);
  }
  periodo(inicio: number, fin: number | null): string {
    return `${this.anio(inicio)} – ${fin === null ? this.t('hoy') : this.anio(fin)}`;
  }
  /** «≈ 1.400 millones», «≈ 26 millones», «≈ 80.000». */
  cantidad(n: number): string {
    const f = (x: number) => x.toLocaleString(this.idioma, { maximumFractionDigits: x < 10 ? 1 : 0 });
    return '≈ ' + (n >= 1e6 ? `${f(n / 1e6)} ${this.t(n >= 2e6 ? 'millones' : 'millon')}` : f(n));
  }
}
