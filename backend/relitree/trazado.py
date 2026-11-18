"""Trazado automático del árbol: asigna a cada religión un carril (x) dentro de su región.

Cada tradición tiene un carril propio y una línea de vida hasta su fin o hasta el presente.
Una rama posterior a la extinción obtiene una prolongación discontinua.

Se colocan en orden cronológico. Cada derivación toma la posición disponible más cercana
a su origen dentro de su región. Si hay empate, se da prioridad a los cruces limpios.
"""
from __future__ import annotations
from collections import Counter
from .modelo import Religion, REGION_IDS, ANIO_ACTUAL
from . import escala
from .escala import y_de

ANCHO_CARRIL = 150
MARGEN_REGION = 90


def radio(importancia: int) -> float:
    return 13 + importancia * 3.2


def lineas(nombre: str, maximo: int = 17) -> int:
    """Número de líneas de la etiqueta (misma partición que el front, máximo tres)."""
    n, actual = 0, ""
    for palabra in nombre.split(" "):
        if actual and len(actual) + 1 + len(palabra) > maximo:
            n += 1; actual = palabra
        else:
            actual = f"{actual} {palabra}".strip()
    return min(3, n + (1 if actual else 0))


def alto_etiqueta(r: Religion) -> float:
    return 8 + 15 * lineas(r.nombre) + 18


def calcular(religiones: dict[str, Religion]) -> dict:
    escala.configurar([r.inicio for r in religiones.values()])
    hijos: dict[str, list[Religion]] = {}
    for r in religiones.values():
        if r.padre:
            hijos.setdefault(r.padre, []).append(r)

    def cima(r: Religion) -> float:
        """Coordenada y hasta la que sube la línea de vida."""
        y = y_de(r.fin if r.fin is not None else ANIO_ACTUAL)
        for h in hijos.get(r.id, []):
            y = min(y, y_de(h.inicio))
        return y

    idx = {reg: n for n, reg in enumerate(REGION_IDS)}
    capacidad = Counter(r.region for r in religiones.values())
    libres = {reg: set(range(capacidad[reg])) for reg in REGION_IDS}
    ocupado: dict[str, dict[int, tuple[float, float]]] = {reg: {} for reg in REGION_IDS}
    pasillos: dict[str, list[tuple[float, float, float]]] = {reg: [] for reg in REGION_IDS}
    carril: dict[str, int] = {}
    INF = 10 ** 6

    def tramos(r: Religion, c: int) -> list[tuple[str, float, float]]:
        """Carriles que cruza la rama desde el origen: (región, desde, hasta), extremos excluidos."""
        p = religiones.get(r.padre) if r.padre else None
        if p is None:
            return []
        cp = carril[p.id]
        if p.region == r.region:
            return [(r.region, min(cp, c) + 1, max(cp, c) - 1)] if abs(cp - c) > 1 else []
        a, b = idx[p.region], idx[r.region]
        if a < b:
            medio = [(REGION_IDS[n], -INF, INF) for n in range(a + 1, b)]
            return [(p.region, cp + 1, INF), *medio, (r.region, -INF, c - 1)]
        medio = [(REGION_IDS[n], -INF, INF) for n in range(b + 1, a)]
        return [(p.region, -INF, cp - 1), *medio, (r.region, c + 1, INF)]

    def rama_limpia(r: Religion, c: int, y: float) -> bool:
        for reg, d, h in tramos(r, c):
            for k, (yn, rn) in ocupado[reg].items():
                if d <= k <= h and abs(y - yn) <= rn + 8:
                    return False
        return True

    orden = sorted(religiones.values(), key=lambda r: (r.inicio, -r.importancia, r.id))
    pendientes, colocadas = list(orden), set()
    while pendientes:                               # el origen siempre antes que sus ramas
        r = next(x for x in pendientes if x.padre is None or x.padre in colocadas)
        pendientes.remove(r)
        y = y_de(r.inicio)
        rad = radio(r.importancia)
        ultimo = capacidad[r.region] - 1
        p = religiones.get(r.padre) if r.padre else None
        if p is None:
            deseado = ultimo // 2
        elif p.region == r.region:
            deseado = carril[p.id]
        else:
            deseado = 0 if idx[p.region] < idx[r.region] else ultimo

        distancia = min(abs(c - deseado) for c in libres[r.region])
        cercanos = (c for c in libres[r.region] if abs(c - deseado) == distancia)

        def prioridad(c: int) -> tuple[bool, bool, int]:
            pisa_simbolo = any(d <= c <= h and abs(yr - y) <= rad + 8 for yr, d, h in pasillos[r.region])
            return pisa_simbolo, not rama_limpia(r, c, y), c

        elegido = min(cercanos, key=prioridad)
        libres[r.region].remove(elegido)
        ocupado[r.region][elegido] = (y, rad)
        for reg, d, h in tramos(r, elegido):
            pasillos[reg].append((y, d, h))
        carril[r.id] = elegido
        colocadas.add(r.id)

    posiciones: dict[str, dict] = {}
    regiones_out, x0 = [], 0.0
    for reg in REGION_IDS:
        for r in religiones.values():
            if r.region == reg:
                posiciones[r.id] = {
                    "x": round(x0 + MARGEN_REGION + (carril[r.id] + 0.5) * ANCHO_CARRIL, 1),
                    "y": round(y_de(r.inicio), 1),
                    "y_fin": round(cima(r), 1),
                }
        ancho = 2 * MARGEN_REGION + max(1, capacidad[reg]) * ANCHO_CARRIL
        regiones_out.append({"id": reg, "x": round(x0, 1), "ancho": round(ancho, 1)})
        x0 += ancho
    return {"posiciones": posiciones, "regiones": regiones_out, "ancho_total": round(x0, 1)}
