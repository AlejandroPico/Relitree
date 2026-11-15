"""Modelo de datos de Relitree: regiones, tipos, carga y validación de fichas."""
from __future__ import annotations
import json, unicodedata
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DIR_RELIGIONES = RAIZ / "religiones"
DIR_TEMAS = RAIZ / "enciclopedia" / "temas"
ANIO_ACTUAL = 2026

# id, nombre, color (orden = eje horizontal, de oeste a este siguiendo las migraciones humanas)
REGIONES = [
    ("afr", "África", "#c8924a"),
    ("eur", "Europa", "#5fae6a"),
    ("opr", "Oriente Próximo", "#d9b93f"),
    ("asn", "Asia Central y Septentrional", "#e0873d"),
    ("asm", "Asia Meridional", "#e2603f"),
    ("aso", "Asia Oriental", "#d6455d"),
    ("sea", "Sudeste Asiático", "#c05aa8"),
    ("oce", "Oceanía", "#8a6fd6"),
    ("nam", "Norteamérica", "#5a86dc"),
    ("mes", "Mesoamérica y Caribe", "#3fa9c4"),
    ("sam", "Sudamérica", "#3fb59a"),
]
REGION_IDS = [r[0] for r in REGIONES]

TIPOS = {
    "rit": "Ritual prehistórico", "ani": "Animismo", "cha": "Chamanismo",
    "ant": "Culto a los antepasados", "pol": "Politeísmo", "hen": "Henoteísmo",
    "mon": "Monoteísmo", "dua": "Dualismo", "pan": "Panteísmo o monismo",
    "nte": "No teísta", "fil": "Filosofía", "mis": "Culto mistérico",
    "eso": "Esoterismo", "sin": "Sincretismo", "neo": "Neopaganismo",
    "nmr": "Nuevo movimiento religioso",
}
RELACIONES = {"derivacion", "cisma", "reforma", "sincretismo", "renacimiento"}


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
    articulo_md: str = ""

    @property
    def padre(self) -> str | None:
        return self.padres[0]["id"] if self.padres else None


def normalizar(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def cargar(directorio: Path = DIR_RELIGIONES) -> dict[str, Religion]:
    religiones: dict[str, Religion] = {}
    for carpeta in sorted(p for p in directorio.iterdir() if p.is_dir()):
        ficha = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
        md = carpeta / "articulo.md"
        r = Religion(
            id=ficha["id"], nombre=ficha["nombre"], region=ficha["region"],
            inicio=ficha["inicio"], fin=ficha.get("fin"), tipo=ficha["tipo"],
            importancia=ficha.get("importancia", 1), resumen=ficha.get("resumen", ""),
            padres=ficha.get("padres", []), influencias=ficha.get("influencias", []),
            alias=ficha.get("alias", []), icono=ficha.get("icono"),
            articulo_md=md.read_text(encoding="utf-8") if md.exists() else "",
        )
        if r.id != carpeta.name:
            raise ValueError(f"{carpeta.name}: el id de la ficha ({r.id}) no coincide con la carpeta")
        religiones[r.id] = r
    return religiones


def validar(religiones: dict[str, Religion]) -> list[str]:
    """Devuelve la lista de errores (vacía si todo es coherente)."""
    e: list[str] = []
    for r in religiones.values():
        if r.region not in REGION_IDS: e.append(f"{r.id}: región desconocida {r.region}")
        if r.tipo not in TIPOS: e.append(f"{r.id}: tipo desconocido {r.tipo}")
        if not 1 <= r.importancia <= 5: e.append(f"{r.id}: importancia fuera de 1-5")
        if r.fin is not None and r.fin < r.inicio: e.append(f"{r.id}: termina antes de empezar")
        if r.inicio > ANIO_ACTUAL: e.append(f"{r.id}: inicio en el futuro")
        for p in r.padres:
            if p["id"] not in religiones: e.append(f"{r.id}: padre inexistente {p['id']}"); continue
            if p.get("relacion", "derivacion") not in RELACIONES: e.append(f"{r.id}: relación desconocida")
            if religiones[p["id"]].inicio > r.inicio: e.append(f"{r.id}: es anterior a su padre {p['id']}")
        for i in r.influencias:
            if i not in religiones: e.append(f"{r.id}: influencia inexistente {i}")
    # ciclos en la filiación principal
    for r in religiones.values():
        visto, actual = set(), r
        while actual and actual.padre in religiones:
            if actual.id in visto: e.append(f"{r.id}: ciclo de filiación"); break
            visto.add(actual.id); actual = religiones[actual.padre]
    return e
