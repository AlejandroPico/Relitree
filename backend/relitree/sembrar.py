"""Siembra las tradiciones nuevas de backend/semilla/religiones.txt (solo las que aún no existen).

Uso: python -m relitree.sembrar
Crea religiones/<id>/ficha.json, añade nombre y resumen a i18n/es/religiones.json y deja el
artículo inicial en enciclopedia/es/religiones/<id>.md. Lo ya existente no se toca.
"""
import json
from pathlib import Path
from .modelo import DIR_RELIGIONES, DIR_I18N, DIR_ENCICLOPEDIA, IDIOMA_BASE

SEMILLA = Path(__file__).resolve().parents[1] / "semilla" / "religiones.txt"


def main() -> None:
    ruta_textos = DIR_I18N / IDIOMA_BASE / "religiones.json"
    textos = json.loads(ruta_textos.read_text(encoding="utf-8")) if ruta_textos.exists() else {}
    articulos = DIR_ENCICLOPEDIA / IDIOMA_BASE / "religiones"
    articulos.mkdir(parents=True, exist_ok=True)
    creadas = 0
    for linea in SEMILLA.read_text(encoding="utf-8").splitlines():
        if not linea.strip() or linea.startswith("#"):
            continue
        id_, nombre, region, inicio, fin, tipo, imp, padres, infl, resumen = linea.split("|")
        carpeta = DIR_RELIGIONES / id_
        if carpeta.exists():
            continue
        carpeta.mkdir(parents=True)
        lista_padres = []
        for p in filter(None, padres.split(",")):
            pid, _, rel = p.partition(":")
            lista_padres.append({"id": pid, "relacion": rel or ("sincretismo" if tipo == "sin" and lista_padres else "derivacion")})
        ficha = {"id": id_, "region": region, "inicio": int(inicio), "fin": int(fin) if fin else None,
                 "tipo": tipo, "importancia": int(imp), "padres": lista_padres,
                 "influencias": [i for i in infl.split(",") if i], "icono": None}
        (carpeta / "ficha.json").write_text(json.dumps(ficha, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        textos.setdefault(id_, {"nombre": nombre, "alias": [], "resumen": resumen})
        md = articulos / f"{id_}.md"
        if not md.exists():
            md.write_text(f"# {nombre}\n\n{resumen}\n", encoding="utf-8")
        creadas += 1
    ruta_textos.write_text(json.dumps(textos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Tradiciones nuevas: {creadas}")


if __name__ == "__main__":
    main()
