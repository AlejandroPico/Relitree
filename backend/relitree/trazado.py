"""Trazado automático del árbol: asigna a cada religión un carril (x) dentro de su región.

Cada tradición ocupa un nodo (símbolo + etiqueta) y, encima, una línea de vida que solo sube
hasta donde hace falta: hasta su última rama o, si es un tronco (importancia ≥ 4), hasta su
final o el presente. Así un mismo carril aloja muchas tradiciones apiladas en el tiempo.

Se colocan en orden cronológico. Cada una busca el carril libre más cercano al de su origen,
comprobando que la rama horizontal que la une a él no atraviese ningún nodo ya colocado.
"""
from __future__ import annotations
from .modelo import Religion, REGION_IDS, ANIO_ACTUAL
from . import escala
from .escala import y_de

ANCHO_CARRIL = 150
MARGEN_REGION = 90
HOLGURA = 16
TRONCO = 4              # importancia mínima para que la línea llegue a su final o al presente


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
        y = y_de(r.inicio)
        if r.importancia >= TRONCO:
            y = min(y, y_de(r.fin if r.fin is not None else ANIO_ACTUAL))
        for h in hijos.get(r.id, []):
            y = min(y, y_de(h.inicio))
        return y

    idx = {reg: n for n, reg in enumerate(REGION_IDS)}
    # por región: carril → lista de (arriba, abajo, y del nodo, radio) ; pasillos de ramas (y, desde, hasta)
    ocupado: dict[str, dict[int, list[tuple[float, float, float, float]]]] = {reg: {} for reg in REGION_IDS}
    pasillos: dict[str, list[tuple[float, float, float]]] = {reg: [] for reg in REGION_IDS}
    carril: dict[str, int] = {}
    INF = 10 ** 6

    def libre(reg: str, c: int, arriba: float, abajo: float, y0: float, rad: float, estricto: bool = True) -> bool:
        for a, b, _, _ in ocupado[reg].get(c, []):
            if not (abajo <= a or arriba >= b):
                return False
        if not estricto:
            return True
        # ninguna rama ajena debe pasar por encima del símbolo (sí puede pasar bajo la etiqueta)
        return not any(d <= c <= h and abs(y - y0) <= rad + 8 for y, d, h in pasillos[reg])

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
            for k, lista in ocupado[reg].items():
                if d <= k <= h and any(abs(y - yn) <= rn + 8 for _, _, yn, rn in lista):
                    return False
        return True

    orden = sorted(religiones.values(), key=lambda r: (r.inicio, -r.importancia, r.id))
    pendientes, colocadas = list(orden), set()
    while pendientes:                               # el origen siempre antes que sus ramas
        r = next(x for x in pendientes if x.padre is None or x.padre in colocadas)
        pendientes.remove(r)
        y = y_de(r.inicio)
        arriba = cima(r) - HOLGURA
        rad = radio(r.importancia)
        abajo = y + rad + alto_etiqueta(r) + HOLGURA
        arriba = min(arriba, y - rad - HOLGURA)
        usados = ocupado[r.region]
        lo, hi = (min(usados), max(usados)) if usados else (0, -1)
        p = religiones.get(r.padre) if r.padre else None
        if p is None:
            deseado = (lo + hi) // 2
        elif p.region == r.region:
            deseado = carril[p.id]
        else:
            deseado = lo if idx[p.region] < idx[r.region] else hi
        candidatos = sorted(range(lo, hi + 1), key=lambda c: (abs(c - deseado), c))
        elegido = next((c for c in candidatos if libre(r.region, c, arriba, abajo, y, rad) and rama_limpia(r, c, y)), None)
        if elegido is None:                         # sin cruce limpio posible: basta con que el hueco esté libre
            elegido = next((c for c in candidatos if libre(r.region, c, arriba, abajo, y, rad, False)), None)
        if elegido is None:                         # sin hueco: carril nuevo en el borde más cercano
            elegido = lo - 1 if deseado - lo < hi - deseado else hi + 1
        usados.setdefault(elegido, []).append((arriba, abajo, y, rad))
        for reg, d, h in tramos(r, elegido):
            pasillos[reg].append((y, d, h))
        carril[r.id] = elegido
        colocadas.add(r.id)

    posiciones: dict[str, dict] = {}
    regiones_out, x0 = [], 0.0
    for reg in REGION_IDS:
        usados = ocupado[reg]
        lo, hi = (min(usados), max(usados)) if usados else (0, 0)
        for r in religiones.values():
            if r.region == reg:
                posiciones[r.id] = {
                    "x": round(x0 + MARGEN_REGION + (carril[r.id] - lo + 0.5) * ANCHO_CARRIL, 1),
                    "y": round(y_de(r.inicio), 1),
                    "y_fin": round(cima(r), 1),
                }
        ancho = 2 * MARGEN_REGION + (hi - lo + 1) * ANCHO_CARRIL
        regiones_out.append({"id": reg, "x": round(x0, 1), "ancho": round(ancho, 1)})
        x0 += ancho
    return {"posiciones": posiciones, "regiones": regiones_out, "ancho_total": round(x0, 1)}
