"""Escala temporal no lineal: más espacio cuanto más reciente y documentado es el periodo."""
from .modelo import ANIO_ACTUAL

# (año inicial del tramo hacia el pasado, píxeles por año dentro del tramo)
TRAMOS = [
    (ANIO_ACTUAL, 1800, 5.5),
    (1800, 1000, 2.5),
    (1000, -1000, 1.3),
    (-1000, -4000, 0.5),
    (-4000, -12000, 0.12),
    (-12000, -50000, 0.02),
    (-50000, -300000, 0.003),
]
MARGEN_SUPERIOR = 130
ANIO_MINIMO = TRAMOS[-1][1]

MARCAS = [2026, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 800, 600, 400, 200, 1,
          -200, -400, -600, -800, -1000, -1500, -2000, -2500, -3000, -3500, -4000, -6000, -8000, -10000,
          -12000, -20000, -30000, -40000, -50000, -100000, -200000, -300000]


def y_de(anio: float) -> float:
    anio = max(ANIO_MINIMO, min(ANIO_ACTUAL, anio))
    y = MARGEN_SUPERIOR
    for desde, hasta, ppa in TRAMOS:
        if anio >= hasta:
            return y + (desde - anio) * ppa
        y += (desde - hasta) * ppa
    return y


ALTO_TOTAL = y_de(ANIO_MINIMO) + 140
