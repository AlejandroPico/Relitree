"""Crea las carpetas de religiones/ a partir de la semilla (solo las que aún no existen).

Uso: python -m relitree.sembrar [--forzar]
Tras la siembra, la fuente canónica es cada carpeta religiones/<id>/; la semilla no se vuelve a leer.
"""
import json, sys
from pathlib import Path
from .modelo import DIR_RELIGIONES

SEMILLA = Path(__file__).resolve().parents[1] / "semilla" / "religiones.txt"


def main() -> None:
    forzar = "--forzar" in sys.argv
    DIR_RELIGIONES.mkdir(exist_ok=True)
    creadas = 0
    for linea in SEMILLA.read_text(encoding="utf-8").splitlines():
        if not linea.strip() or linea.startswith("#"):
            continue
        id_, nombre, region, inicio, fin, tipo, imp, padres, infl, resumen = linea.split("|")
        carpeta = DIR_RELIGIONES / id_
        if carpeta.exists() and not forzar:
            continue
        carpeta.mkdir(exist_ok=True)
        lista_padres = []
        for p in filter(None, padres.split(",")):
            pid, _, rel = p.partition(":")
            lista_padres.append({"id": pid, "relacion": rel or ("sincretismo" if tipo == "sin" and lista_padres else "derivacion")})
        ficha = {
            "id": id_, "nombre": nombre, "alias": [], "region": region,
            "inicio": int(inicio), "fin": int(fin) if fin else None,
            "tipo": tipo, "importancia": int(imp),
            "padres": lista_padres, "influencias": [i for i in infl.split(",") if i],
            "resumen": resumen, "icono": None,
        }
        previa = carpeta / "ficha.json"
        if previa.exists():                      # conservar icono y alias ya trabajados
            vieja = json.loads(previa.read_text(encoding="utf-8"))
            ficha["icono"], ficha["alias"] = vieja.get("icono"), vieja.get("alias", [])
        previa.write_text(json.dumps(ficha, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        md = carpeta / "articulo.md"
        if not md.exists():
            md.write_text(f"# {nombre}\n\n{resumen}\n", encoding="utf-8")
        creadas += 1
    print(f"Fichas escritas: {creadas}")


if __name__ == "__main__":
    main()
