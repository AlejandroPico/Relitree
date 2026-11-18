import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18n } from './i18n';

@Component({
  selector: 'rel-regla-temporal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vis-regla" [attr.aria-label]="i18n.t('anioVista')">
      @for (m of marcas(); track m.anio) {
        <i [style.left.px]="m.x" aria-hidden="true"></i>
        <span [style.left.px]="m.x" [class.inicio]="m.x < 58" [class.fin]="m.x > ancho() - 58">{{ i18n.anio(m.anio) }}</span>
      }
    </div>
  `,
})
export class ReglaTemporal {
  readonly marcas = input.required<{ anio: number; x: number }[]>();
  readonly ancho = input.required<number>();
  readonly i18n = inject(I18n);
}
