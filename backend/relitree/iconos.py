"""Descarga símbolos SVG libres de Wikimedia Commons y anota su licencia en cada ficha.

Uso: python -m relitree.iconos [id ...]
Lee backend/semilla/iconos.json: { "<id>": ["Nombre de archivo en Commons.svg", ...candidatos] }.
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


def pedir(url: str) -> bytes:
    for intento in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": AGENTE}), timeout=30) as r:
                return r.read()
        except Exception as e:                                   # límite de peticiones: esperar y reintentar
            if intento == 3: raise
            time.sleep(4 * (intento + 1))
    return b""


def buscar(archivo: str) -> dict | None:
    q = urllib.parse.urlencode({"action": "query", "titles": f"File:{archivo}", "prop": "imageinfo", "redirects": 1,
                                "iiprop": "url|extmetadata|size", "format": "json"})
    paginas = json.loads(pedir(f"{API}?{q}"))["query"]["pages"]
    info = next(iter(paginas.values())).get("imageinfo")
    if not info: return None
    i, meta = info[0], info[0].get("extmetadata", {})
    licencia = meta.get("LicenseShortName", {}).get("value", "")
    if not i["url"].split("?")[0].lower().endswith(".svg") or not LIBRES.match(licencia) or i.get("size", 0) > 400_000: return None
    autor = html.unescape(re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", ""))).strip()
    return {"url": i["url"], "fuente": i["descriptionurl"], "licencia": licencia, "autor": autor[:120] or "Wikimedia Commons"}


def main() -> None:
    lista = json.loads(LISTA.read_text(encoding="utf-8"))
    solo = set(sys.argv[1:])
    hechos, fallidos = 0, []
    for rid, candidatos in lista.items():
        carpeta = DIR_RELIGIONES / rid
        if (solo and rid not in solo) or not carpeta.exists() or (carpeta / "icono.svg").exists(): continue
        for archivo in candidatos:
            try: dato = buscar(archivo)
            except Exception as e: print(f"  {rid}: {e}"); dato = None
            time.sleep(1.2)
            if not dato: continue
            try: contenido = pedir(dato["url"])
            except Exception as e: print(f"  {rid}: {e}"); continue
            if b"<svg" not in contenido[:2000]: continue
            (carpeta / "icono.svg").write_bytes(contenido); time.sleep(1.2)
            ficha = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
            ficha["icono"] = {"archivo": "icono.svg", "fuente": dato["fuente"], "licencia": dato["licencia"], "autor": dato["autor"]}
            (carpeta / "ficha.json").write_text(json.dumps(ficha, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            hechos += 1; print(f"OK {rid}: {archivo} ({dato['licencia']})"); break
        else:
            fallidos.append(rid)
    print(f"Iconos nuevos: {hechos}. Sin encontrar: {', '.join(fallidos) or 'ninguno'}")


if __name__ == "__main__":
    main()
