"""Genera public/datos/relitree.sqlite (y copia los iconos) a partir de religiones/, i18n/ y enciclopedia/.

Uso: python -m relitree.construir
"""
from __future__ import annotations
import json, re, shutil, sqlite3, sys
from datetime import date
from html import escape
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
CREATE TABLE articulos (idioma TEXT, id TEXT, grupo TEXT, padre TEXT, titulo TEXT, busqueda TEXT, html TEXT, orden INTEGER, PRIMARY KEY (idioma, id));
CREATE INDEX idx_rel_origen ON relaciones(origen);
CREATE INDEX idx_rel_destino ON relaciones(destino);
"""



TITULO_FUENTES = re.compile(r"^#{2,6}\s+(?:Fuentes|Bibliografía|Referencias)[ \t]*$", re.M | re.I)
CITA = re.compile(r"(?<!!)\[(\d+(?:\s*[,;–—-]\s*\d+)*)\](?![\[(])")


def palabras_de_cuerpo(texto: str) -> int:
    """Cuenta prosa y listas. Excluye encabezados, tablas, citas, figuras y bibliografía."""
    cuerpo = TITULO_FUENTES.split(texto, maxsplit=1)[0]
    cuerpo = re.sub(r"(?ms)^(`{3,}|~{3,})[^\n]*\n.*?^\1[ \t]*$", "", cuerpo)
    cuerpo = re.sub(r"(?is)<(?:figure|table|blockquote|pre)\b[^>]*>.*?</(?:figure|table|blockquote|pre)>", "", cuerpo)
    cuerpo = re.sub(r"(?m)^\s*(?:[#|>].*|!\[.*)$", "", cuerpo)
    cuerpo = re.sub(r"\[\[([^]]+)\]\]", lambda m: m[1].split("|")[-1], cuerpo)
    cuerpo = re.sub(r"!\[[^]]*\]\([^)]+\)", "", cuerpo)
    cuerpo = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", cuerpo)
    cuerpo = re.sub(r"(?m)^(\s*)\d+\.\s+", r"\1", cuerpo)
    cuerpo = CITA.sub("", cuerpo)
    return len(re.findall(r"[^\W_]+(?:[’'-][^\W_]+)*", cuerpo))


def enlazar_citas(texto: str) -> str:
    titulo = TITULO_FUENTES.search(texto)
    if not titulo:
        return texto
    fuentes = texto[titulo.end():]
    existentes = set()

    def marcar(m: re.Match) -> str:
        existentes.add(int(m[1]))
        return f'{m[1]}. <span class="ancla-fuente" id="fuente-{m[1]}"></span>'

    fuentes = re.sub(r"^(\d+)[.)][ \t]+", marcar, fuentes, flags=re.M)

    def cita(m: re.Match) -> str:
        numeros: list[int] = []
        for parte in re.split(r"\s*[,;]\s*", m[1]):
            limites = [int(n) for n in re.split(r"\s*[–—-]\s*", parte)]
            if len(limites) == 2:
                primero, ultimo = limites
                if not 0 <= ultimo - primero < 100:
                    return m[0]
                numeros.extend(range(primero, ultimo + 1))
            else:
                numeros.extend(limites)
        if not all(n in existentes for n in numeros):
            return m[0]
        ids = " ".join(f"fuente-{n}" for n in dict.fromkeys(numeros))
        return f'<a class="cita-fuente" href="#fuente-{numeros[0]}" data-fuentes="{ids}">{m[0]}</a>'

    return CITA.sub(cita, texto[:titulo.end()]) + fuentes


def a_html(md: str, nombres: dict[str, str]) -> str:
    """Markdown → HTML. [[id]] o [[id|texto]] enlaza con otra religión, un subartículo (id/slug) o un tema."""
    def enlace(m: re.Match) -> str:
        rid, _, texto = m.group(1).partition("|")
        destino = rid if rid in nombres or "/" in rid or rid.startswith("tema:") else f"tema:{rid}"
        return f'<a data-ir="{escape(destino, quote=True)}">{escape(texto or nombres.get(rid, rid))}</a>'
    md = re.sub(r"^# .*\n", "", md, count=1)          # el título lo pinta la interfaz
    md = re.sub(r"(?m)^> Borrador editorial de E\d+\.[ \t]*\n", "", md)
    md = re.sub(r"\[\[([^\]]+)\]\]", enlace, md)
    return markdown.markdown(enlazar_citas(md), extensions=["tables", "sane_lists", "fenced_code", "toc"],
                             extension_configs={"toc": {"toc_depth": "2-6"}})


def titulo_de(texto: str, reserva: str) -> str:
    primera = texto.lstrip().splitlines()[0] if texto.strip() else ""
    return primera.lstrip("# ").strip() if primera.startswith("#") else reserva


def separar_cabecera(texto: str) -> tuple[str, str]:
    """Separa la cabecera de un artículo o índice sin modificar el Markdown antiguo."""
    cabecera = re.match(r"\A---[ \t]*\n(?P<datos>.*?\n)---[ \t]*(?:\n|$)", texto, re.DOTALL)
    if cabecera and re.match(r"[a-zA-Z_][\w-]*:", cabecera["datos"]):
        return cabecera["datos"], texto[cabecera.end():].lstrip("\n")
    return "", texto


def insertar_articulo(bd, idioma, md, id_articulo, grupo, padre, nombres, reserva, orden=None):
    cabecera, texto = separar_cabecera(md.read_text(encoding="utf-8-sig"))
    if re.search(r"^estado:\s*completo\s*$", cabecera, re.M):
        palabras = palabras_de_cuerpo(texto)
        if palabras < 5000:
            raise ValueError(f"{md.relative_to(RAIZ) if md.is_relative_to(RAIZ) else md}: {palabras} palabras de cuerpo. Mínimo: 5000.")
    titulo = titulo_de(texto, reserva)
    bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?,?,?,?)", (
        idioma, id_articulo, grupo, padre, titulo, normalizar(titulo), a_html(texto, nombres), orden,
    ))


def insertar_subarticulos(bd, idioma, carpeta, prefijo, grupo, padre, nombres):
    if not carpeta.is_dir():
        return 0
    total = 0
    for ruta in sorted(carpeta.iterdir()):
        if ruta.is_dir():
            prefijo_hijo = f"{prefijo}/{ruta.name}"
            categoria = f"categoria:{prefijo_hijo}"
            indice = ruta / "_indice.md"
            cabecera, texto = separar_cabecera(indice.read_text(encoding="utf-8-sig")) if indice.is_file() else ("", "")
            orden = re.search(r"^orden:\s*(-?\d+)\s*$", cabecera, re.MULTILINE)
            titulo = titulo_de(texto, ruta.name.replace("-", " ").capitalize())
            total_hijo = insertar_subarticulos(bd, idioma, ruta, prefijo_hijo, grupo, categoria, nombres)
            if total_hijo:
                bd.execute("INSERT INTO articulos VALUES (?,?,?,?,?,?,?,?)", (
                    idioma, categoria, grupo, padre, titulo, normalizar(titulo), None,
                    int(orden[1]) if orden else None,
                ))
                total += total_hijo
        elif ruta.suffix == ".md" and ruta.name != "_indice.md":
            insertar_articulo(bd, idioma, ruta, f"{prefijo}/{ruta.stem}", grupo, padre, nombres, ruta.stem)
            total += 1
    return total


def main() -> int:
    religiones = modelo.cargar()
    errores = modelo.validar(religiones)
    if errores:
        print("\n".join(errores), file=sys.stderr)
        return 1
    plano = trazado.calcular(religiones)

    SALIDA.mkdir(parents=True, exist_ok=True)
    medios = DIR_ENCICLOPEDIA / "medios"
    if medios.is_dir():
        shutil.copytree(medios, SALIDA / "medios", dirs_exist_ok=True)
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
        for md in sorted((enc / "religiones").glob("*.md")):
            if md.stem not in religiones:
                continue
            r = religiones[md.stem]
            insertar_articulo(bd, idioma, md, md.stem, r.region, None, nombres, nombres.get(md.stem, md.stem))
            n_articulos += 1 + insertar_subarticulos(bd, idioma, md.parent / md.stem, md.stem, r.region, md.stem, nombres)
        for md in sorted((enc / "temas").glob("*.md")):
            numero, separador, resto = md.stem.partition("-")
            slug = resto if separador and numero.isdigit() else md.stem
            orden = int(numero) if separador and numero.isdigit() else None
            insertar_articulo(bd, idioma, md, f"tema:{slug}", "tema", None, nombres, slug, orden)
            n_articulos += 1
    bd.commit(); bd.execute("VACUUM"); bd.close()
    tmp.replace(bd_ruta)
    print(f"{len(religiones)} religiones, {n_articulos} articulos; lienzo {plano['ancho_total']:.0f}x{escala.ALTO_TOTAL:.0f}; {bd_ruta.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
