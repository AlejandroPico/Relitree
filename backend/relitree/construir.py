"""Genera public/datos/relitree.sqlite (y copia los iconos) a partir de religiones/ y enciclopedia/.

Uso: python -m relitree.construir
"""
from __future__ import annotations
import json, re, shutil, sqlite3, sys
from datetime import date
from pathlib import Path
import markdown
from . import modelo, trazado, escala
from .modelo import RAIZ, REGIONES, TIPOS, normalizar

SALIDA = RAIZ / "public" / "datos"
VERSION = json.loads((RAIZ / "package.json").read_text(encoding="utf-8"))["version"]

ESQUEMA = """
CREATE TABLE metadatos (clave TEXT PRIMARY KEY, valor TEXT);
CREATE TABLE regiones (id TEXT PRIMARY KEY, orden INTEGER, nombre TEXT, color TEXT, x REAL, ancho REAL);
CREATE TABLE tipos (id TEXT PRIMARY KEY, nombre TEXT);
CREATE TABLE religiones (
  id TEXT PRIMARY KEY, nombre TEXT, busqueda TEXT, region TEXT REFERENCES regiones(id),
  inicio INTEGER, fin INTEGER, tipo TEXT REFERENCES tipos(id), importancia INTEGER,
  resumen TEXT, x REAL, y REAL, y_fin REAL, icono TEXT, icono_credito TEXT);
CREATE TABLE relaciones (origen TEXT, destino TEXT, clase TEXT, principal INTEGER);
CREATE TABLE articulos (id TEXT PRIMARY KEY, grupo TEXT, titulo TEXT, busqueda TEXT, html TEXT);
CREATE INDEX idx_rel_origen ON relaciones(origen);
CREATE INDEX idx_rel_destino ON relaciones(destino);
"""


def a_html(md: str, religiones) -> str:
    """Markdown → HTML. [[id]] o [[id|texto]] se convierte en enlace interno de la enciclopedia."""
    def enlace(m: re.Match) -> str:
        rid, _, texto = m.group(1).partition("|")
        if rid in religiones:
            return f'<a data-ir="{rid}">{texto or religiones[rid].nombre}</a>'
        return f'<a data-ir="tema:{rid}">{texto or rid}</a>'
    md = re.sub(r"^# .*\n", "", md, count=1)          # el título lo pinta la interfaz
    md = re.sub(r"\[\[([^\]]+)\]\]", enlace, md)
    return markdown.markdown(md, extensions=["tables", "sane_lists"])


def main() -> int:
    religiones = modelo.cargar()
    errores = modelo.validar(religiones)
    if errores:
        print("\n".join(errores), file=sys.stderr)
        return 1
    plano = trazado.calcular(religiones)

    SALIDA.mkdir(parents=True, exist_ok=True)
    iconos = SALIDA / "iconos"
    iconos.mkdir(exist_ok=True)
    bd_ruta = SALIDA / "relitree.sqlite"
    tmp = bd_ruta.with_suffix(".tmp")
    tmp.unlink(missing_ok=True)
    bd = sqlite3.connect(tmp)
    bd.executescript(ESQUEMA)
    meta = {
        "version": VERSION, "generado": date.today().isoformat(),
        "ancho": plano["ancho_total"], "alto": escala.ALTO_TOTAL,
        "tramos": json.dumps(escala.TRAMOS), "marcas": json.dumps(escala.MARCAS),
        "margen_superior": escala.MARGEN_SUPERIOR,
    }
    bd.executemany("INSERT INTO metadatos VALUES (?,?)", [(k, str(v)) for k, v in meta.items()])
    geo = {g["id"]: g for g in plano["regiones"]}
    bd.executemany("INSERT INTO regiones VALUES (?,?,?,?,?,?)",
                   [(i, n, nombre, color, geo[i]["x"], geo[i]["ancho"]) for n, (i, nombre, color) in enumerate(REGIONES)])
    bd.executemany("INSERT INTO tipos VALUES (?,?)", TIPOS.items())
    for r in religiones.values():
        p = plano["posiciones"][r.id]
        icono, credito = None, None
        origen_icono = modelo.DIR_RELIGIONES / r.id / "icono.svg"
        if origen_icono.exists():
            shutil.copyfile(origen_icono, iconos / f"{r.id}.svg")
            icono = f"datos/iconos/{r.id}.svg"
            credito = json.dumps(r.icono, ensure_ascii=False) if r.icono else None
        bd.execute("INSERT INTO religiones VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                   (r.id, r.nombre, normalizar(" ".join([r.nombre, *r.alias])), r.region, r.inicio, r.fin,
                    r.tipo, r.importancia, r.resumen, p["x"], p["y"], p["y_fin"], icono, credito))
        for n, padre in enumerate(r.padres):
            bd.execute("INSERT INTO relaciones VALUES (?,?,?,?)",
                       (padre["id"], r.id, padre.get("relacion", "derivacion"), 1 if n == 0 else 0))
        for i in r.influencias:
            bd.execute("INSERT INTO relaciones VALUES (?,?,?,0)", (i, r.id, "influencia"))
        bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?)",
                   (r.id, r.region, r.nombre, normalizar(r.nombre), a_html(r.articulo_md, religiones)))
    for md in sorted(modelo.DIR_TEMAS.glob("*.md")):
        texto = md.read_text(encoding="utf-8")
        titulo = texto.splitlines()[0].lstrip("# ").strip()
        bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?)",
                   (f"tema:{md.stem.split('-', 1)[1] if md.stem[:2].isdigit() else md.stem}", "tema", titulo,
                    normalizar(titulo), a_html(texto, religiones)))
    bd.commit(); bd.execute("VACUUM"); bd.close()
    tmp.replace(bd_ruta)
    print(f"{len(religiones)} religiones · lienzo {plano['ancho_total']:.0f}×{escala.ALTO_TOTAL:.0f} · {bd_ruta.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
