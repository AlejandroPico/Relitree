"""Modelo de datos de Relitree: regiones, tipos, carga y validación de fichas.

Los datos estructurales viven en religiones/<id>/ficha.json; todos los textos traducibles,
en i18n/<idioma>/ (interfaz, catálogo y nombres/resúmenes) y en enciclopedia/<idioma>/.
"""
from __future__ import annotations
import json, unicodedata
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DIR_RELIGIONES = RAIZ / "religiones"
DIR_I18N = RAIZ / "i18n"
DIR_ENCICLOPEDIA = RAIZ / "enciclopedia"
IDIOMA_BASE = "es"
ANIO_ACTUAL = 2026

# id, color (orden = eje horizontal, de oeste a este siguiendo las migraciones humanas)
REGIONES = [
    ("afr", "#c8924a"), ("eur", "#5fae6a"), ("opr", "#d9b93f"), ("asn", "#e0873d"),
    ("asm", "#e2603f"), ("aso", "#d6455d"), ("sea", "#c05aa8"), ("oce", "#8a6fd6"),
    ("nam", "#5a86dc"), ("mes", "#3fa9c4"), ("sam", "#3fb59a"),
]
REGION_IDS = [r[0] for r in REGIONES]
TIPOS = ["rit", "ani", "cha", "ant", "pol", "hen", "mon", "dua", "pan", "nte", "fil", "mis", "eso", "sin", "neo", "nmr"]
RELACIONES = {"derivacion", "cisma", "reforma", "sincretismo", "renacimiento"}

# Troncos cuyo símbolo heredan las ramas que no tienen uno propio (como en cualquier atlas de religiones).
FAMILIAS_ICONO = {"cristianismo", "islam", "budismo", "hinduismo", "jainismo", "judaismo", "rabinico",
                  "sijismo", "taoismo", "shinto", "zoroastrismo"}
SIN_HERENCIA = {"sin", "neo", "nmr", "eso", "fil"}      # tipos que no heredan símbolo de su tronco


@dataclass
class Religion:
    id: str
    nombre: str
    region: str
    inicio: int
    fin: int | None
    tipo: str
    importancia: int
    resumen: str
    padres: list[dict] = field(default_factory=list)       # [{id, relacion}]
    influencias: list[str] = field(default_factory=list)
    alias: list[str] = field(default_factory=list)
    icono: dict | None = None                               # {archivo, fuente, licencia, autor}
    fieles: int | None = None                               # estimación actual de fieles
    fieles_fuente: str | None = None

    @property
    def padre(self) -> str | None:
        return self.padres[0]["id"] if self.padres else None


def normalizar(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def leer_json(ruta: Path) -> dict:
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}


def cargar(directorio: Path = DIR_RELIGIONES) -> dict[str, Religion]:
    textos = leer_json(DIR_I18N / IDIOMA_BASE / "religiones.json")
    religiones: dict[str, Religion] = {}
    for carpeta in sorted(p for p in directorio.iterdir() if p.is_dir()):
        ficha = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
        if ficha["id"] != carpeta.name:
            raise ValueError(f"{carpeta.name}: el id de la ficha ({ficha['id']}) no coincide con la carpeta")
        t = textos.get(ficha["id"], {})
        religiones[ficha["id"]] = Religion(
            id=ficha["id"], nombre=t.get("nombre", ""), region=ficha["region"],
            inicio=ficha["inicio"], fin=ficha.get("fin"), tipo=ficha["tipo"],
            importancia=ficha.get("importancia", 1), resumen=t.get("resumen", ""),
            padres=ficha.get("padres", []), influencias=ficha.get("influencias", []),
            alias=t.get("alias", []), icono=ficha.get("icono"),
            fieles=ficha.get("fieles"), fieles_fuente=ficha.get("fieles_fuente"),
        )
    return religiones


def validar(religiones: dict[str, Religion]) -> list[str]:
    """Devuelve la lista de errores (vacía si todo es coherente)."""
    e: list[str] = []
    for r in religiones.values():
        if not r.nombre: e.append(f"{r.id}: falta el nombre en i18n/{IDIOMA_BASE}/religiones.json")
        if r.region not in REGION_IDS: e.append(f"{r.id}: región desconocida {r.region}")
        if r.tipo not in TIPOS: e.append(f"{r.id}: tipo desconocido {r.tipo}")
        if not 1 <= r.importancia <= 5: e.append(f"{r.id}: importancia fuera de 1-5")
        if r.fin is not None and r.fin < r.inicio: e.append(f"{r.id}: termina antes de empezar")
        if r.inicio > ANIO_ACTUAL: e.append(f"{r.id}: inicio en el futuro")
        if r.fieles is not None and r.fin is not None: e.append(f"{r.id}: tiene fieles pero figura como extinguida")
        for p in r.padres:
            if p["id"] not in religiones: e.append(f"{r.id}: padre inexistente {p['id']}"); continue
            if p.get("relacion", "derivacion") not in RELACIONES: e.append(f"{r.id}: relación desconocida")
            if religiones[p["id"]].inicio > r.inicio: e.append(f"{r.id}: es anterior a su padre {p['id']}")
        for i in r.influencias:
            if i not in religiones: e.append(f"{r.id}: influencia inexistente {i}")
    for r in religiones.values():               # ciclos en la filiación principal
        visto, actual = set(), r
        while actual and actual.padre in religiones:
            if actual.id in visto: e.append(f"{r.id}: ciclo de filiación"); break
            visto.add(actual.id); actual = religiones[actual.padre]
    return e


def icono_de(r: Religion, religiones: dict[str, Religion]) -> tuple[str | None, bool]:
    """Id de la religión cuyo icono.svg debe mostrarse y si es heredado de su tronco."""
    if (DIR_RELIGIONES / r.id / "icono.svg").exists():
        return r.id, False
    if r.tipo in SIN_HERENCIA:
        return None, False
    actual = religiones.get(r.padre) if r.padre else None
    while actual:
        if actual.id in FAMILIAS_ICONO:
            return (actual.id, True) if (DIR_RELIGIONES / actual.id / "icono.svg").exists() else (None, False)
        actual = religiones.get(actual.padre) if actual.padre else None
    return None, False
