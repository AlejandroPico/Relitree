import type { Relacion, Religion } from './datos';

export const POR_FECHA = (a: Religion, b: Religion) => a.inicio - b.inicio || b.importancia - a.importancia;

export interface Grupo { id: string; nombre: string; color?: string; elementos: Religion[]; }
export interface NodoGrafo { r: Religion; x: number; y: number; nivel: number; }

export function origenes(relaciones: Relacion[]) {
  return new Map(relaciones.filter(r => r.principal).map(r => [r.destino, r.origen]));
}

/** La cadena principal se usa para organizar el árbol. Las otras fuentes se conservan como relaciones. */
export function ascendencia(id: string, padres: ReadonlyMap<string, string>, porId: ReadonlyMap<string, Religion>): Religion[] {
  const camino: Religion[] = [];
  for (let r = porId.get(id); r; r = porId.get(padres.get(r.id) ?? '')) camino.push(r);
  return camino.reverse();
}

export function cronograma(grupos: Grupo[], x: (a: number) => number, hoy: number, densidad: number) {
  let y = 5;
  return {
    grupos: grupos.map(grupo => {
      const inicio = y;
      const finales: number[] = [];
      const filas = [...grupo.elementos].sort(POR_FECHA).map(r => {
        const x0 = x(r.inicio), x1 = Math.max(x0 + 1, x(r.fin ?? hoy));
        const espacio = Math.max(x1, x0 + Math.min(220, r.nombre.length * 6.5) / densidad);
        let carril = finales.findIndex(fin => fin + 12 / densidad < x0);
        if (carril < 0) carril = finales.length;
        finales[carril] = espacio;
        return { r, x0, x1, y: inicio + 34 + carril * 28 };
      });
      y += 43 + finales.length * 28;
      return { grupo, inicio, fin: y, filas };
    }),
    alto: Math.max(130, y + 14),
  };
}

export function nivelesGrafo(centro: Religion | undefined, visibles: Religion[], relaciones: Relacion[]) {
  const niveles = new Map<string, number>();
  if (!centro) {
    const padres = origenes(relaciones);
    const nivelDe = (id: string): number => {
      const nivel = niveles.get(id);
      if (nivel !== undefined) return nivel;
      const padre = padres.get(id);
      const generacion = padre ? nivelDe(padre) + 1 : 0;
      niveles.set(id, generacion);
      return generacion;
    };
    for (const r of visibles) nivelDe(r.id);
    return niveles;
  }
  niveles.set(centro.id, 0);
  const genealogia = relaciones.filter(r => r.clase !== 'influencia');
  for (const direccion of [-1, 1]) {
    const [sale, entra] = direccion === 1 ? ['origen', 'destino'] as const : ['destino', 'origen'] as const;
    let frontera = [centro.id], paso = 1;
    while (frontera.length) {
      const actuales = new Set(frontera);
      frontera = [];
      for (const rel of genealogia) {
        if (!actuales.has(rel[sale]) || niveles.has(rel[entra])) continue;
        niveles.set(rel[entra], paso * direccion);
        frontera.push(rel[entra]);
      }
      paso++;
    }
  }
  return niveles;
}

export function dibujarGrafo(niveles: ReadonlyMap<string, number>, relaciones: Relacion[],
                            porId: ReadonlyMap<string, Religion>, limite: number, centro?: Religion) {
  const soloInfluencia = new Set<string>();
  for (const rel of relaciones) {
    if (!centro || rel.clase !== 'influencia') continue;
    const vecino = rel.origen === centro.id ? rel.destino : rel.destino === centro.id ? rel.origen : null;
    if (vecino && !niveles.has(vecino)) soloInfluencia.add(vecino);
  }
  const grupos = new Map<number, Religion[]>();
  for (const [id, nivel] of niveles) {
    if (Math.abs(nivel) > limite) continue;
    const g = grupos.get(nivel) ?? [];
    g.push(porId.get(id)!);
    grupos.set(nivel, g);
  }
  const orden = [...grupos.keys()].sort((a, b) => a - b);
  const pasoVertical = 49;
  const altoGrafo = Math.max(232, ...[...grupos.values()].map(g => g.length * pasoVertical + 48));
  const columnasInfluencia = Math.max(2, orden.length);
  const ancho = Math.max(540, orden.length * 302 + 32);
  const nodos: NodoGrafo[] = orden.flatMap((nivel, i) => {
    const grupo = grupos.get(nivel)!.sort(POR_FECHA);
    return grupo.map((r, n) => ({
      r, x: (i + .5) * ancho / orden.length, y: altoGrafo / 2 + (n - (grupo.length - 1) / 2) * pasoVertical, nivel,
    }));
  });
  [...soloInfluencia].map(id => porId.get(id)!).sort(POR_FECHA).forEach((r, i) => {
    nodos.push({
      r, nivel: Infinity,
      x: ((i % columnasInfluencia) + .5) * ancho / columnasInfluencia,
      y: altoGrafo + 44 + Math.floor(i / columnasInfluencia) * pasoVertical,
    });
  });
  const puntos = new Map(nodos.map(n => [n.r.id, n]));
  const enlaces = relaciones.flatMap(rel => {
    const a = puntos.get(rel.origen), b = puntos.get(rel.destino);
    return a && b ? [{ a, b, rel }] : [];
  });
  return { nodos, enlaces, ancho, alto: altoGrafo + (soloInfluencia.size ? 52 + Math.ceil(soloInfluencia.size / columnasInfluencia) * pasoVertical : 0) };
}

/** Dibuja fechas redondas con una separación estable en píxeles, incluso en una escala por tramos. */
export function marcasAdaptativas(marcas: number[], x: (anio: number) => number, inicio: number, fin: number, ancho: number) {
  if (!ancho) return [];
  const cortes = [inicio, ...marcas.filter(a => a > inicio && a < fin).reverse(), fin];
  const fechas = new Set<number>([inicio, fin]);
  const hueco = ancho < 600 ? 78 : 96;

  for (let i = 1; i < cortes.length; i++) {
    const a = cortes[i - 1], b = cortes[i], xa = x(a), xb = x(b);
    if (xb < 0 || xa > ancho || xb <= xa) continue;
    const porAnio = (xb - xa) / (b - a);
    const necesario = Math.max(1, hueco / porAnio);
    const potencia = 10 ** Math.floor(Math.log10(necesario));
    const paso = [1, 2, 5, 10].map(n => n * potencia).find(n => n >= necesario)!;
    const desde = a + (Math.max(xa, 0) - xa) / porAnio;
    const hasta = a + (Math.min(xb, ancho) - xa) / porAnio;
    for (let f = Math.ceil(desde / paso) * paso; f <= hasta; f += paso) {
      if (f !== 0) fechas.add(f);
    }
    fechas.add(a);
    fechas.add(b);
  }

  const seleccionadas: { anio: number; x: number }[] = [];
  const insertar = (anio: number) => {
    const p = x(anio);
    if (anio === 0 || p < -.5 || p > ancho + .5 || seleccionadas.some(m => Math.abs(m.x - p) < hueco)) return;
    seleccionadas.push({ anio, x: Math.min(ancho, Math.max(0, p)) });
  };
  insertar(inicio);
  insertar(fin);
  for (const a of [...fechas].sort((a, b) => a - b)) insertar(a);
  return seleccionadas.sort((a, b) => a.x - b.x);
}

/** Sigue las ramas en cada sentido sin retroceder desde un antepasado hacia ramas laterales. */
export function resaltarGrafo(id: string | undefined, enlaces: Relacion[], conexion?: Relacion) {
  const nodos = new Set<string>(), ramas = new Set<Relacion>();
  const origen = conexion?.origen ?? id, destino = conexion?.destino ?? id;
  if (!origen || !destino) return { nodos, ramas };
  for (const [salida, entrada, partida] of [
    ['origen', 'destino', destino], ['destino', 'origen', origen],
  ] as const) {
    const indice = new Map<string, Relacion[]>();
    for (const rel of enlaces) {
      if (rel.clase === 'influencia') continue;
      const grupo = indice.get(rel[salida]) ?? [];
      grupo.push(rel);
      indice.set(rel[salida], grupo);
    }
    const cola = [partida], vistos = new Set(cola);
    nodos.add(partida);
    for (let i = 0; i < cola.length; i++) {
      for (const rel of indice.get(cola[i]) ?? []) {
        ramas.add(rel);
        const vecino = rel[entrada];
        nodos.add(vecino);
        if (!vistos.has(vecino)) {
          vistos.add(vecino);
          cola.push(vecino);
        }
      }
    }
  }
  if (conexion) {
    ramas.add(conexion);
  } else {
    for (const rel of enlaces) {
      if (rel.origen !== id && rel.destino !== id) continue;
      ramas.add(rel);
      nodos.add(rel.origen);
      nodos.add(rel.destino);
    }
  }
  return { nodos, ramas };
}
