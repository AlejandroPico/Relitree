import sqlite3

import pytest

from relitree.construir import ESQUEMA, a_html, insertar_articulo, palabras_de_cuerpo


def test_indices_y_citas_enlazadas():
    texto = """# Artículo

## La investigación

Texto con varias referencias [1, 2–3] y un número ajeno [4].

## Fuentes

1. Una fuente
2. Otra fuente
3. Una tercera fuente
"""
    html = a_html(texto, {})
    assert 'id="la-investigacion"' in html
    assert 'data-fuentes="fuente-1 fuente-2 fuente-3"' in html
    assert 'id="fuente-3"' in html
    assert '[4]' in html and 'data-fuentes="fuente-4"' not in html


def test_recuento_excluye_fuentes_titulos_tablas_citas_e_imagenes():
    texto = """# Uno
## Dos
Texto documentado [1, 2]. [[articulo|Otro ejemplo]].
![Una imagen](foto.svg)
> Una cita de otro autor.
| A | B |
|---|---|
| ejemplo | ejemplo |
<figure><figcaption>Una leyenda.</figcaption></figure>

1. Una entrada.

## Fuentes
1. Una fuente y sus autores.
"""
    assert palabras_de_cuerpo(texto) == 6


def test_articulo_breve_solo_puede_guardarse_como_borrador(tmp_path):
    md = tmp_path / "prueba.md"
    md.write_text("---\nestado: completo\npalabras: 6000\n---\n# Título\n\nPocas palabras.", encoding="utf-8")
    with sqlite3.connect(":memory:") as bd:
        bd.executescript(ESQUEMA)
        with pytest.raises(ValueError, match="2 palabras"):
            insertar_articulo(bd, "es", md, "prueba", "tema", None, {}, "Prueba")
        md.write_text(md.read_text(encoding="utf-8").replace("completo", "borrador"), encoding="utf-8")
        insertar_articulo(bd, "es", md, "prueba", "tema", None, {}, "Prueba")
