"""Genera public/datos/relitree.sqlite (y copia los iconos) a partir de religiones/, i18n/ y enciclopedia/.

Uso: python -m relitree.construir
"""
from __future__ import annotations
import json, re, shutil, sqlite3, sys
from datetime import date
from pathlib import Path
import markdown
from . import modelo, trazado, escala
from .modelo import RAIZ, REGIONES, TIPOS, DIR_I18N, DIR_ENCICLOPEDIA, normalizar, leer_json

SALIDA = RAIZ / "public" / "datos"
VERSION = json.loads((RAIZ / "package.json").read_text(encoding="utf-8"))["version"]

ESQUEMA = """
CREATE TABLE metadatos (clave TEXT PRIMARY KEY, valor TEXT);
CREATE TABLE idiomas (id TEXT PRIMARY KEY);
CREATE TABLE interfaz (idioma TEXT, clave TEXT, texto TEXT, PRIMARY KEY (idioma, clave));
CREATE TABLE nombres (idioma TEXT, clase TEXT, id TEXT, nombre TEXT, PRIMARY KEY (idioma, clase, id));
CREATE TABLE regiones (id TEXT PRIMARY KEY, orden INTEGER, color TEXT, x REAL, ancho REAL);
CREATE TABLE tipos (id TEXT PRIMARY KEY, orden INTEGER);
CREATE TABLE religiones (
  id TEXT PRIMARY KEY, region TEXT REFERENCES regiones(id), inicio INTEGER, fin INTEGER,
  tipo TEXT REFERENCES tipos(id), importancia INTEGER, x REAL, y REAL, y_fin REAL,
  icono TEXT, icono_credito TEXT, icono_heredado INTEGER, fieles INTEGER, fieles_max INTEGER, fieles_fuente TEXT);
CREATE TABLE textos (idioma TEXT, id TEXT, nombre TEXT, busqueda TEXT, resumen TEXT, PRIMARY KEY (idioma, id));
CREATE TABLE relaciones (origen TEXT, destino TEXT, clase TEXT, principal INTEGER);
CREATE TABLE articulos (idioma TEXT, id TEXT, grupo TEXT, padre TEXT, titulo TEXT, busqueda TEXT, html TEXT, PRIMARY KEY (idioma, id));
CREATE INDEX idx_rel_origen ON relaciones(origen);
CREATE INDEX idx_rel_destino ON relaciones(destino);
"""


def a_html(md: str, nombres: dict[str, str]) -> str:
    """Markdown → HTML. [[id]] o [[id|texto]] enlaza con otra religión, un subartículo (id/slug) o un tema."""
    def enlace(m: re.Match) -> str:
        rid, _, texto = m.group(1).partition("|")
        destino = rid if rid in nombres or "/" in rid else f"tema:{rid}"
        return f'<a data-ir="{destino}">{texto or nombres.get(rid, rid)}</a>'
    md = re.sub(r"^# .*\n", "", md, count=1)          # el título lo pinta la interfaz
    md = re.sub(r"\[\[([^\]]+)\]\]", enlace, md)
    return markdown.markdown(md, extensions=["tables", "sane_lists"])


def titulo_de(texto: str, reserva: str) -> str:
    primera = texto.lstrip().splitlines()[0] if texto.strip() else ""
    return primera.lstrip("# ").strip() if primera.startswith("#") else reserva


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
    for viejo in iconos.glob("*.svg"):                 # iconos de fichas que ya no lo tienen
        if not (modelo.DIR_RELIGIONES / viejo.stem / "icono.svg").exists():
            viejo.unlink()
    bd_ruta = SALIDA / "relitree.sqlite"
    tmp = bd_ruta.with_suffix(".tmp")
    tmp.unlink(missing_ok=True)
    bd = sqlite3.connect(tmp)
    bd.executescript(ESQUEMA)
    meta = {
        "version": VERSION, "generado": date.today().isoformat(), "idioma_base": modelo.IDIOMA_BASE,
        "ancho": plano["ancho_total"], "alto": escala.ALTO_TOTAL,
        "tramos": json.dumps(escala.TRAMOS), "marcas": json.dumps(escala.MARCAS),
        "margen_superior": escala.MARGEN_SUPERIOR,
    }
    bd.executemany("INSERT INTO metadatos VALUES (?,?)", [(k, str(v)) for k, v in meta.items()])
    geo = {g["id"]: g for g in plano["regiones"]}
    bd.executemany("INSERT INTO regiones VALUES (?,?,?,?,?)",
                   [(i, n, color, geo[i]["x"], geo[i]["ancho"]) for n, (i, color) in enumerate(REGIONES)])
    bd.executemany("INSERT INTO tipos VALUES (?,?)", [(t, n) for n, t in enumerate(TIPOS)])

    for r in religiones.values():
        p = plano["posiciones"][r.id]
        origen, heredado = modelo.icono_de(r, religiones)
        icono = credito = None
        if origen:
            shutil.copyfile(modelo.DIR_RELIGIONES / origen / "icono.svg", iconos / f"{origen}.svg")
            icono = f"datos/iconos/{origen}.svg"
            credito = json.dumps(religiones[origen].icono, ensure_ascii=False) if religiones[origen].icono else None
        bd.execute("INSERT INTO religiones VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                   (r.id, r.region, r.inicio, r.fin, r.tipo, r.importancia, p["x"], p["y"], p["y_fin"],
                    icono, credito, int(heredado), r.fieles, r.fieles_max, r.fieles_fuente))
        for n, padre in enumerate(r.padres):
            bd.execute("INSERT INTO relaciones VALUES (?,?,?,?)",
                       (padre["id"], r.id, padre.get("relacion", "derivacion"), 1 if n == 0 else 0))
        for i in r.influencias:
            bd.execute("INSERT INTO relaciones VALUES (?,?,?,0)", (i, r.id, "influencia"))

    # ---- textos por idioma: solo lo que existe; el front recurre al idioma base para lo que falte ----
    n_articulos = 0
    for carpeta in sorted(p for p in DIR_I18N.iterdir() if p.is_dir()):
        idioma = carpeta.name
        bd.execute("INSERT INTO idiomas VALUES (?)", (idioma,))
        bd.executemany("INSERT INTO interfaz VALUES (?,?,?)",
                       [(idioma, k, v) for k, v in leer_json(carpeta / "interfaz.json").items()])
        catalogo = leer_json(carpeta / "catalogo.json")
        for clase, clave in (("region", "regiones"), ("tipo", "tipos")):
            bd.executemany("INSERT INTO nombres VALUES (?,?,?,?)",
                           [(idioma, clase, k, v) for k, v in catalogo.get(clave, {}).items()])
        textos = leer_json(carpeta / "religiones.json")
        bd.executemany("INSERT INTO textos VALUES (?,?,?,?,?)",
                       [(idioma, k, t["nombre"], normalizar(" ".join([t["nombre"], *t.get("alias", [])])), t.get("resumen", ""))
                        for k, t in textos.items() if k in religiones and t.get("nombre")])
        nombres = {k: t["nombre"] for k, t in textos.items() if t.get("nombre")} or {k: r.nombre for k, r in religiones.items()}
        enc = DIR_ENCICLOPEDIA / idioma
        for md in sorted((enc / "religiones").glob("*.md")) if (enc / "religiones").exists() else []:
            if md.stem not in religiones: continue
            texto = md.read_text(encoding="utf-8")
            titulo = titulo_de(texto, nombres.get(md.stem, md.stem))
            bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?,?,?)",
                       (idioma, md.stem, religiones[md.stem].region, None, titulo, normalizar(titulo), a_html(texto, nombres)))
            n_articulos += 1
            for sub in sorted((enc / "religiones" / md.stem).glob("*.md")) if (enc / "religiones" / md.stem).exists() else []:
                texto = sub.read_text(encoding="utf-8")
                titulo = titulo_de(texto, sub.stem)
                bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?,?,?)",
                           (idioma, f"{md.stem}/{sub.stem}", religiones[md.stem].region, md.stem, titulo, normalizar(titulo), a_html(texto, nombres)))
                n_articulos += 1
        for md in sorted((enc / "temas").glob("*.md")) if (enc / "temas").exists() else []:
            texto = md.read_text(encoding="utf-8")
            slug = md.stem.split("-", 1)[1] if md.stem[:2].isdigit() else md.stem
            titulo = titulo_de(texto, slug)
            bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?,?,?)",
                       (idioma, f"tema:{slug}", "tema", None, titulo, normalizar(titulo), a_html(texto, nombres)))
            n_articulos += 1
    bd.commit(); bd.execute("VACUUM"); bd.close()
    tmp.replace(bd_ruta)
    print(f"{len(religiones)} religiones, {n_articulos} articulos; lienzo {plano['ancho_total']:.0f}x{escala.ALTO_TOTAL:.0f}; {bd_ruta.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
