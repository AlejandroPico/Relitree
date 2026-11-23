import json
import sqlite3

import pytest

from relitree.construir import ESQUEMA, a_html, insertar_articulo, metadatos_articulo, palabras_de_cuerpo


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

        editorial, = bd.execute("SELECT editorial FROM articulos WHERE id = 'prueba'").fetchone()
        assert json.loads(editorial)['palabras'] == 2


def test_busqueda_indexa_prosa_visible_y_resuelve_la_seccion(tmp_path):
    md = tmp_path / 'articulo.md'
    md.write_text("""---
ficha_resumen: {"Sede": "Cartago"}
fuentes:
  - "https://example.org/texto"
---
# Iglesia

Introducción.

## África romana

En la ciudad de *Cártago* se escribe & se publica.

<div class="galeria-articulo" role="group" aria-label="galería">
<figure><img src="ruta-invisible.jpg" alt="texto alternativo"><figcaption>Un manuscrito.</figcaption></figure>
</div>
""", encoding='utf-8')
    with sqlite3.connect(':memory:') as bd:
        bd.executescript(ESQUEMA)
        insertar_articulo(bd, 'es', md, 'iglesia', 'tema', None, {}, 'Iglesia')
        seccion, titulo, texto, buscable = bd.execute("""
            SELECT seccion, titulo_seccion, texto, normalizado FROM articulos_texto
            WHERE id = 'iglesia' AND instr(normalizado, 'cartago') > 0
        """).fetchone()
        assert (seccion, titulo) == ('africa-romana', 'África romana')
        assert 'Cártago se escribe & se publica.' in texto
        assert 'Un manuscrito.' in texto
        assert 'ruta-invisible' not in buscable and 'galeria-articulo' not in buscable
        editorial, = bd.execute("SELECT editorial FROM articulos WHERE id = 'iglesia'").fetchone()
        assert json.loads(editorial) == {
            'estado': 'borrador', 'fase': None, 'palabras': 10,
            'fuentes': ['https://example.org/texto'], 'ficha': {'Sede': 'Cartago'},
        }


def test_ficha_principal_e18_requiere_extension_y_figuras_distintas(tmp_path):
    ficha = tmp_path / "religiones" / "tradicion.md"
    cabecera = "estado: completo\nfase: E18\npalabras: 10000\n"
    breve = "detalle " * 5000
    amplio = "detalle " * 10000
    fotos = "\n\n".join(f"![Ilustración](foto{i}.jpg)" for i in range(6))
    with pytest.raises(ValueError, match="Mínimo: 10000"):
        metadatos_articulo(cabecera, breve, ficha)
    with pytest.raises(ValueError, match="6 imágenes"):
        metadatos_articulo(cabecera, amplio + "\n\n" + fotos.replace("foto5", "foto0"), ficha)
    articulo = amplio + "\n\n" + fotos + "\n\n## Fuentes\n\n1. Una referencia."
    assert json.loads(metadatos_articulo(cabecera, articulo, ficha))["palabras"] == 10000
    assert json.loads(metadatos_articulo(cabecera, breve, ficha.parent / "tradicion" / "tema.md"))["palabras"] == 5000
