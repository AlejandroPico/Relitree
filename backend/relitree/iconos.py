"""Descarga símbolos SVG libres de Wikimedia Commons y anota su licencia en cada ficha.

Uso: python -m relitree.iconos [id ...]
Lee backend/semilla/iconos.json:
  "archivos":  { "<id>": ["Nombre exacto en Commons.svg", ...] }   candidatos por nombre de archivo
  "busquedas": { "<id>": "términos de búsqueda en Commons" }      si ningún candidato existe
Solo acepta dominio público, CC0 y CC BY / BY-SA; guarda religiones/<id>/icono.svg y rellena
ficha.icono = {archivo, fuente, licencia, autor}. No sobrescribe iconos existentes.
"""
import html, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
from .modelo import DIR_RELIGIONES

LISTA = Path(__file__).resolve().parents[1] / "semilla" / "iconos.json"
API = "https://commons.wikimedia.org/w/api.php"
AGENTE = "Relitree/1.0 (https://github.com/AlejandroPico/Relitree) python-urllib"
LIBRES = re.compile(r"^(public domain|pd|cc0|cc[ -]by([ -]sa)?[ -][1-4]\.\d)", re.I)
PAUSA = 1.5


def pedir(url: str) -> bytes:
    for intento in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": AGENTE}), timeout=20) as r:
                return r.read()
        except Exception:                                        # límite de peticiones: esperar y reintentar
            if intento == 2: raise
            time.sleep(6 * (intento + 1))
    return b""


def consulta(**params) -> dict:
    params |= {"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|extmetadata|size"}
    time.sleep(PAUSA)
    return json.loads(pedir(f"{API}?{urllib.parse.urlencode(params)}")).get("query", {})


def valido(pagina: dict) -> dict | None:
    info = pagina.get("imageinfo")
    if not info: return None
    i, meta = info[0], info[0].get("extmetadata", {})
    licencia = meta.get("LicenseShortName", {}).get("value", "")
    if not i["url"].split("?")[0].lower().endswith(".svg") or not LIBRES.match(licencia) or i.get("size", 0) > 250_000: return None
    autor = html.unescape(re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", ""))).strip()
    return {"url": i["url"], "fuente": i["descriptionurl"], "licencia": licencia, "autor": autor[:120] or "Wikimedia Commons"}


def guardar(rid: str, dato: dict) -> bool:
    carpeta = DIR_RELIGIONES / rid
    try:
        time.sleep(PAUSA); contenido = pedir(dato["url"])
    except Exception as e:
        print(f"  {rid}: {e}", flush=True); return False
    if b"<svg" not in contenido[:3000]: return False
    (carpeta / "icono.svg").write_bytes(contenido)
    ficha = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
    ficha["icono"] = {"archivo": "icono.svg", "fuente": dato["fuente"], "licencia": dato["licencia"], "autor": dato["autor"]}
    (carpeta / "ficha.json").write_text(json.dumps(ficha, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK {rid}: {dato['fuente'].rsplit(':', 1)[-1]} ({dato['licencia']})", flush=True)
    return True


def main() -> None:
    lista = json.loads(LISTA.read_text(encoding="utf-8"))
    solo = set(sys.argv[1:])
    falta = lambda rid: (not solo or rid in solo) and (DIR_RELIGIONES / rid).exists() and not (DIR_RELIGIONES / rid / "icono.svg").exists()
    hechos = 0
    # 1) candidatos por nombre exacto, consultados de 40 en 40 títulos
    pares = [(rid, a) for rid, archivos in lista["archivos"].items() if falta(rid) for a in archivos]
    encontrados: dict[str, dict] = {}
    for n in range(0, len(pares), 40):
        try: q = consulta(titles="|".join(f"File:{a}" for _, a in pares[n:n + 40]))
        except Exception as e: print(f"  lote {n}: {e}", flush=True); continue
        norm = {x["from"]: x["to"] for x in q.get("normalized", [])}
        for p in q.get("pages", {}).values():
            d = valido(p)
            if d: encontrados[p["title"]] = d
        for rid, a in pares[n:n + 40]:
            t = norm.get(f"File:{a}", f"File:{a}")
            if t in encontrados and falta(rid) and guardar(rid, encontrados[t]): hechos += 1
    # 2) búsqueda en Commons para los que siguen sin símbolo
    for rid, texto in lista["busquedas"].items():
        if not falta(rid): continue
        try: q = consulta(generator="search", gsrsearch=f"{texto} filemime:image/svg+xml", gsrnamespace=6, gsrlimit=6)
        except Exception as e: print(f"  {rid}: {e}", flush=True); continue
        for p in sorted(q.get("pages", {}).values(), key=lambda p: p.get("index", 99)):
            d = valido(p)
            if d and guardar(rid, d): hechos += 1; break
    print(f"Iconos nuevos: {hechos}", flush=True)


if __name__ == "__main__":
    main()
