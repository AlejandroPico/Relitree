"""Trazado automático del árbol: asigna a cada religión un carril (x) dentro de su región.

Cada tradición es una línea de vida vertical (del inicio al final o al presente). Las hijas
se colocan alternando a izquierda y derecha de su origen, las más recientes más cerca, de modo
que las ramas horizontales no se cruzan entre hermanas. Un carril se reutiliza cuando la
tradición anterior ya se ha extinguido, para compactar sin amontonar.
"""
from __future__ import annotations
from .modelo import Religion, REGION_IDS, ANIO_ACTUAL
from .escala import y_de

ANCHO_CARRIL = 136
MARGEN_REGION = 60
ALTO_ETIQUETA = 84      # espacio reservado bajo el nodo para nombre y fecha
HOLGURA = 26
RETROCESO = 6           # carriles hacia atrás en los que se intenta reutilizar hueco


def radio(importancia: int) -> float:
    return 13 + importancia * 3.2


def indirecta(padre: Religion, hija: Religion) -> bool:
    """Filiación a distancia: renacimientos y herencias que saltan más de tres siglos de vacío."""
    rel = hija.padres[0].get("relacion", "derivacion")
    return rel == "renacimiento" or (padre.fin is not None and hija.inicio - padre.fin > 300)


def calcular(religiones: dict[str, Religion]) -> dict:
    hijos: dict[str, list[Religion]] = {}
    for r in religiones.values():
        if r.padre:
            hijos.setdefault(r.padre, []).append(r)

    def locales(r: Religion) -> list[Religion]:
        return sorted((h for h in hijos.get(r.id, []) if h.region == r.region),
                      key=lambda h: -h.inicio)

    def secuencia(r: Religion) -> list[Religion]:
        izq, der = [], []
        for i, h in enumerate(locales(r)):
            (der if i % 2 == 0 else izq).append(secuencia(h))
        salida: list[Religion] = []
        for bloque in reversed(izq): salida += bloque
        salida.append(r)
        for bloque in der: salida += bloque
        return salida

    def intervalo(r: Religion) -> tuple[float, float]:
        arriba = y_de(r.fin if r.fin is not None else ANIO_ACTUAL)
        for h in hijos.get(r.id, []):           # prolongación hasta la última hija directa
            if not indirecta(r, h):
                arriba = min(arriba, y_de(h.inicio))
        return arriba - radio(r.importancia) - HOLGURA, y_de(r.inicio) + ALTO_ETIQUETA + HOLGURA

    posiciones: dict[str, dict] = {}
    regiones_out, x0 = [], 0.0
    for idx, reg in enumerate(REGION_IDS):
        def clave(r: Religion):
            p = religiones.get(r.padre) if r.padre else None
            lado = 0 if p is None else (-1 if REGION_IDS.index(p.region) < idx else 1)
            return (lado, r.inicio if lado <= 0 else -r.inicio)
        raices = sorted((r for r in religiones.values() if r.region == reg and
                         (r.padre is None or religiones[r.padre].region != reg)), key=clave)
        carriles: list[list[tuple[float, float]]] = []
        for raiz in raices:
            for r in secuencia(raiz):
                a, b = intervalo(r)
                elegido = None
                for c in range(len(carriles) - 1, max(-1, len(carriles) - 1 - RETROCESO), -1):
                    if all(b <= oa or a >= ob for oa, ob in carriles[c]):
                        elegido = c; break
                if elegido is None:
                    carriles.append([]); elegido = len(carriles) - 1
                carriles[elegido].append((a, b))
                posiciones[r.id] = {
                    "x": round(x0 + MARGEN_REGION + elegido * ANCHO_CARRIL + ANCHO_CARRIL / 2, 1),
                    "y": round(y_de(r.inicio), 1),
                    "y_fin": round(y_de(r.fin if r.fin is not None else ANIO_ACTUAL), 1),
                }
        ancho = 2 * MARGEN_REGION + max(1, len(carriles)) * ANCHO_CARRIL
        regiones_out.append({"id": reg, "x": round(x0, 1), "ancho": round(ancho, 1)})
        x0 += ancho
    return {"posiciones": posiciones, "regiones": regiones_out, "ancho_total": round(x0, 1)}
