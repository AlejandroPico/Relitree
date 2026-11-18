import type { Datos, Relacion, Religion } from './datos';

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

export function cronograma(grupos: Grupo[], x: (a: number) => number, hoy: number) {
  let y = 54;
  return {
    grupos: grupos.map(grupo => {
      const inicio = y;
      const finales: number[] = [];
      const filas = [...grupo.elementos].sort(POR_FECHA).map(r => {
        const x0 = x(r.inicio), x1 = Math.max(x0 + 1, x(r.fin ?? hoy));
        const espacio = Math.max(x1, x0 + Math.min(220, r.nombre.length * 6.5));
        let carril = finales.findIndex(fin => fin + 12 < x0);
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

export function grafoLocal(centro: Religion, relaciones: Relacion[], porId: ReadonlyMap<string, Religion>, profundidad: number) {
  const niveles = new Map<string, number>([[centro.id, 0]]);
  const genealogia = relaciones.filter(r => r.clase !== 'influencia');
  for (const direccion of [-1, 1]) {
    const [sale, entra] = direccion === 1 ? ['origen', 'destino'] as const : ['destino', 'origen'] as const;
    let frontera = [centro.id];
    for (let paso = 1; paso <= profundidad && frontera.length; paso++) {
      const actuales = new Set(frontera);
      frontera = [];
      for (const rel of genealogia) {
        if (!actuales.has(rel[sale]) || niveles.has(rel[entra])) continue;
        niveles.set(rel[entra], paso * direccion);
        frontera.push(rel[entra]);
      }
    }
  }
  const soloInfluencia = new Set<string>();
  for (const rel of relaciones) {
    if (rel.clase !== 'influencia') continue;
    const vecino = rel.origen === centro.id ? rel.destino : rel.destino === centro.id ? rel.origen : null;
    if (vecino && !niveles.has(vecino)) soloInfluencia.add(vecino);
  }
  const grupos = new Map<number, Religion[]>();
  for (const [id, nivel] of niveles) {
    const g = grupos.get(nivel) ?? [];
    g.push(porId.get(id)!);
    grupos.set(nivel, g);
  }
  const orden = [...grupos.keys()].sort((a, b) => a - b);
  const altoGrafo = Math.max(232, ...[...grupos.values()].map(g => g.length * 38 + 48));
  const columnasInfluencia = Math.max(2, orden.length);
  const ancho = Math.max(540, orden.length * 248 + 32);
  const nodos: NodoGrafo[] = orden.flatMap((nivel, i) => {
    const grupo = grupos.get(nivel)!.sort(POR_FECHA);
    return grupo.map((r, n) => ({
      r, x: (i + .5) * ancho / orden.length, y: altoGrafo / 2 + (n - (grupo.length - 1) / 2) * 38, nivel,
    }));
  });
  [...soloInfluencia].map(id => porId.get(id)!).sort(POR_FECHA).forEach((r, i) => {
    nodos.push({
      r, nivel: 100,
      x: ((i % columnasInfluencia) + .5) * ancho / columnasInfluencia,
      y: altoGrafo + 44 + Math.floor(i / columnasInfluencia) * 38,
    });
  });
  const puntos = new Map(nodos.map(n => [n.r.id, n]));
  const enlaces = relaciones.flatMap(rel => {
    const a = puntos.get(rel.origen), b = puntos.get(rel.destino);
    return a && b ? [{ a, b, rel }] : [];
  });
  return { nodos, enlaces, ancho, alto: altoGrafo + (soloInfluencia.size ? 52 + Math.ceil(soloInfluencia.size / columnasInfluencia) * 38 : 0) };
}

export function marcasEje(d: Datos, x: (y: number) => number, inicio: number, fin: number, hueco = 86) {
  const marcas = [inicio, ...d.marcas.filter(a => a > inicio && a < fin).reverse(), fin];
  let anterior = -Infinity;
  return marcas.filter(a => {
    const p = x(a);
    if (p - anterior < hueco || (a !== fin && a !== inicio && x(fin) - p < hueco)) return false;
    anterior = p;
    return true;
  });
}
