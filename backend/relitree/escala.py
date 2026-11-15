"""Escala temporal adaptativa: cada periodo recibe espacio vertical según cuántas tradiciones nacen en él.

Así la densidad del árbol es parecida en todas las épocas: los siglos recientes, llenos de
movimientos, se estiran, y los milenios vacíos de la prehistoria se comprimen.
"""
from .modelo import ANIO_ACTUAL

CORTES = [ANIO_ACTUAL, 2000, 1975, 1950, 1925, 1900, 1875, 1850, 1800, 1750, 1700, 1600, 1500, 1400, 1300, 1200,
          1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 1, -200, -400, -600, -800, -1000, -1500, -2000,
          -2500, -3000, -3500, -4000, -6000, -8000, -10000, -12000, -20000, -30000, -40000, -50000, -100000,
          -200000, -300000]
MARCAS = CORTES
BASE_TRAMO = 34         # píxeles mínimos de cada tramo
POR_TRADICION = 20      # píxeles añadidos por cada tradición que nace en el tramo
MARGEN_SUPERIOR = 130
ANIO_MINIMO = CORTES[-1]

TRAMOS: list[tuple[int, int, float]] = []      # (desde, hasta, píxeles por año); lo rellena configurar()
ALTO_TOTAL = 0.0


def configurar(inicios: list[int]) -> None:
    """Calcula los tramos a partir de los años de inicio de todas las tradiciones."""
    global ALTO_TOTAL
    TRAMOS.clear()
    for desde, hasta in zip(CORTES, CORTES[1:]):
        n = sum(1 for a in inicios if hasta <= a < desde or (desde == ANIO_ACTUAL and a == desde))
        TRAMOS.append((desde, hasta, (BASE_TRAMO + POR_TRADICION * n) / (desde - hasta)))
    ALTO_TOTAL = y_de(ANIO_MINIMO) + 170


def y_de(anio: float) -> float:
    anio = max(ANIO_MINIMO, min(ANIO_ACTUAL, anio))
    y = MARGEN_SUPERIOR
    for desde, hasta, ppa in TRAMOS:
        if anio >= hasta:
            return y + (desde - anio) * ppa
        y += (desde - hasta) * ppa
    return y
