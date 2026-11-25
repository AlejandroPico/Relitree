import json
import subprocess

from relitree.integridad import REGISTRO, perdidas_sin_registrar


def test_detecta_perdidas_y_exige_revision_para_esa_base(tmp_path):
    def escribir(ruta, texto):
        archivo = tmp_path / ruta
        archivo.parent.mkdir(parents=True, exist_ok=True)
        archivo.write_text(texto, encoding="utf-8")
        return archivo

    def git(*args):
        return subprocess.check_output(["git", "-C", str(tmp_path), *args]).decode().strip()

    fuente = escribir("religiones/precursor/ficha.json", '{"id":"precursor"}')
    ruta_ficha = "religiones/iglesia/ficha.json"
    escribir(ruta_ficha, json.dumps({
        "id": "iglesia",
        "padres": [{"id": "precursor", "relacion": "derivacion"}],
        "influencias": ["tradicion"],
    }))
    articulo = escribir("enciclopedia/es/religiones/precursor.md", "# Un precursor")
    ruta_iglesia = "enciclopedia/es/religiones/iglesia.md"
    escribir(ruta_iglesia, "---\nestado: completo\n---\n# Una iglesia")
    git("init", "-q")
    git("add", ".")
    git("-c", "user.name=Pruebas", "-c", "user.email=pruebas@example.org", "commit", "-qm", "Inventario")
    base = git("rev-parse", "HEAD")

    assert perdidas_sin_registrar(tmp_path, base) == set()
    fuente.unlink()
    articulo.unlink()
    escribir(ruta_ficha, '{"id":"iglesia"}')
    escribir(ruta_iglesia, "---\nestado: borrador\n---\n# Una iglesia")
    esperadas = {
        "entidad:precursor",
        "relacion:derivacion:precursor:iglesia:principal",
        "relacion:influencia:tradicion:iglesia",
        "articulo:enciclopedia/es/religiones/precursor.md",
        f"articulo-completo:{ruta_iglesia}",
    }
    assert perdidas_sin_registrar(tmp_path, base) == esperadas
    escribir(REGISTRO, json.dumps([{
        "base": base, "clave": "relacion:influencia:tradicion:iglesia",
        "motivo": "Corrección documentada de la relación", "fuente": "enciclopedia/es/religiones/iglesia.md",
    }, {
        "base": base, "clave": "entidad:precursor", "motivo": "", "fuente": "fuente original",
    }, {
        "base": "f" * 40, "clave": f"articulo-completo:{ruta_iglesia}",
        "motivo": "Otra revisión", "fuente": "fuente original",
    }]))
    assert perdidas_sin_registrar(tmp_path, base) == esperadas - {"relacion:influencia:tradicion:iglesia"}

