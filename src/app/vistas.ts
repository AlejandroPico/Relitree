export const VISTAS = [
  'columnas', 'radial', 'cronologia', 'familias', 'grafo', 'linajes',
  'mapa', 'corte', 'arcos', 'matriz', 'paralelas', 'demografia',
] as const;

export type Visualizacion = typeof VISTAS[number];
