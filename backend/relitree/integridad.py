"""Detecta pérdidas de inventario frente al estado previo a una publicación."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

from relitree.modelo import RAIZ

REGISTRO = "enciclopedia/revisiones-inventario.json"


def git(raiz: Path, *args: str) -> str:
    resultado = subprocess.run(
        ["git", "-C", str(raiz), *args],
        stdout=subprocess.PIPE,
        check=True,
    )
    return resultado.stdout.decode("utf-8")


def inventario_ficha(texto: str) -> set[str]:
    ficha = json.loads(texto)
    identidad = ficha["id"]
    claves = {f"entidad:{identidad}"}
    for indice, padre in enumerate(ficha.get("padres", [])):
        clase = padre.get("relacion", "derivacion")
        nivel = "principal" if indice == 0 else "secundaria"
        claves.add(f"relacion:{clase}:{padre['id']}:{identidad}:{nivel}")
    claves.update(
        f"relacion:influencia:{origen}:{identidad}"
        for origen in ficha.get("influencias", [])
    )
    return claves


def articulo_completo(texto: str) -> bool:
    texto = texto.replace("\r\n", "\n")
    if not texto.startswith("---\n"):
        return False
    cabecera = texto.split("\n---", 1)[0]
    return bool(re.search(r"(?m)^estado:\s*completo[ \t]*$", cabecera))


def perdidas_sin_registrar(raiz: Path, base: str) -> set[str]:
    base = git(raiz, "rev-parse", "--verify", f"{base}^{{commit}}").strip()
    cambiados = git(
        raiz, "diff", "--name-only", "-z", "--no-renames", "--diff-filter=DMT",
        base, "--", "religiones/", "enciclopedia/",
    )
    perdidas: set[str] = set()
    for ruta in cambiados.rstrip("\0").split("\0"):
        actual = raiz / ruta
        if re.fullmatch(r"religiones/[^/]+/ficha\.json", ruta):
            anterior = inventario_ficha(git(raiz, "show", f"{base}:{ruta}"))
            vigente = inventario_ficha(actual.read_text(encoding="utf-8")) if actual.is_file() else set()
            perdidas.update(anterior - vigente)
        elif re.fullmatch(r"enciclopedia/[^/]+/(?:religiones|temas)/.+\.md", ruta):
            if not actual.is_file():
                perdidas.add(f"articulo:{ruta}")
            elif (
                articulo_completo(git(raiz, "show", f"{base}:{ruta}"))
                and not articulo_completo(actual.read_text(encoding="utf-8"))
            ):
                perdidas.add(f"articulo-completo:{ruta}")

    registro = raiz / REGISTRO
    if perdidas and registro.is_file():
        revisiones = json.loads(registro.read_text(encoding="utf-8"))
        for revision in revisiones:
            if revision["base"] != base or revision["clave"] not in perdidas:
                continue
            if all(isinstance(revision.get(campo), str) and revision[campo].strip()
                   for campo in ("motivo", "fuente")):
                perdidas.remove(revision["clave"])
    return perdidas


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python -m relitree.integridad COMMIT_BASE", file=sys.stderr)
        return 2
    pendientes = perdidas_sin_registrar(RAIZ, sys.argv[1])
    if pendientes:
        print("Pérdidas de inventario sin revisión registrada:", file=sys.stderr)
        for clave in sorted(pendientes):
            print(f"- {clave}", file=sys.stderr)
        print(f"Las retiradas justificadas se anotan en {REGISTRO}.", file=sys.stderr)
        return 1
    print("Inventario del árbol y de la enciclopedia verificado frente a la publicación anterior.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

