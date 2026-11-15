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
    por_x = {}
    for rid, p in pos.items():
        r = religiones[rid]
        arriba = min(p["y_fin"], p["y"] - trazado.radio(r.importancia))
        por_x.setdefault(p["x"], []).append((arriba, p["y"] + trazado.radio(r.importancia) + trazado.alto_etiqueta(r), rid))
    for carril in por_x.values():
        carril.sort()
        for (a1, b1, r1), (a2, b2, r2) in zip(carril, carril[1:]):
            assert b1 <= a2, f"{r1} y {r2} se pisan en el mismo carril"
    for r in religiones.values():            # cada religión dentro de la franja de su región
        g = next(g for g in plano["regiones"] if g["id"] == r.region)
        assert g["x"] < pos[r.id]["x"] < g["x"] + g["ancho"]
