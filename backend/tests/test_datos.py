from collections import defaultdict
import math

from relitree import modelo, trazado, escala


def test_fichas_validas():
    religiones = modelo.cargar()
    assert len(religiones) > 250
    assert modelo.validar(religiones) == []


def test_escala_monotona():
    escala.configurar([r.inicio for r in modelo.cargar().values()])
    ys = [escala.y_de(a) for a in (2026, 1800, 1000, 0, -1000, -4000, -12000, -50000, -300000)]
    assert ys == sorted(ys) and ys[0] == escala.MARGEN_SUPERIOR


def test_trazado_sin_solapes():
    religiones = modelo.cargar()
    plano = trazado.calcular(religiones)
    pos = plano["posiciones"]
    assert set(pos) == set(religiones)
    xs = [p["x"] for p in pos.values()]
    assert len(set(xs)) == len(xs)
    familias = defaultdict(list)
    for r in religiones.values():
        xy = pos[r.id]
        if r.fin is None:
            assert math.isclose(xy["y_fin"], escala.y_de(modelo.ANIO_ACTUAL), abs_tol=0.1), r.id
        else:
            assert xy["y_fin"] <= escala.y_de(r.fin) + 0.1, r.id
        if r.padre:
            distancia = abs(xy["x"] - pos[r.padre]["x"])
            familias[r.padre, r.region].append((r.inicio, -r.importancia, r.id, distancia))
    for hijas in familias.values():
        distancias = [h[-1] for h in sorted(hijas)]
        assert distancias == sorted(distancias)
    for r in religiones.values():            # cada religión dentro de la franja de su región
        g = next(g for g in plano["regiones"] if g["id"] == r.region)
        assert g["x"] < pos[r.id]["x"] < g["x"] + g["ancho"]


def test_tramos_antiguos_visualmente_regulares():
    escala.configurar([r.inicio for r in modelo.cargar().values()])
    saltos = [
        escala.y_de(b) - escala.y_de(a)
        for a, b in ((-8000, -10000), (-10000, -12000), (-50000, -100000),
                     (-100000, -200000), (-200000, -300000))
    ]
    assert min(saltos) >= 149.99
    assert all(math.isclose(salto, saltos[0], abs_tol=0.01) for salto in saltos)
