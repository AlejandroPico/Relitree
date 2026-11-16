"""Símbolos propios de Relitree: dibujos vectoriales originales basados en motivos tradicionales.

Para tradiciones sin emblema libre en Wikimedia Commons (culturas arqueológicas, religiones
indígenas, escuelas filosóficas…) se dibuja un motivo característico de su cultura material o
de su simbolismo: el pilar en T de Göbekli Tepe, la máscara kanaga dogona, el tambor de bronce
de Dong Son, la vasija de estribo moche… Todos son trazados propios, monocromos, en un lienzo
de 100×100, con el mismo estilo que los símbolos de Commons.

Uso: python -m relitree.simbolos [--forzar] [id ...]
Escribe religiones/<id>/icono.svg y anota ficha.icono = {archivo, fuente: "propio", motivo, licencia}.
Sin --forzar no toca los iconos que ya existen (descargados o dibujados).
"""
from __future__ import annotations
import json, math, sys
from .modelo import DIR_RELIGIONES

TINTA = "#1d1d1f"
F = f'fill="{TINTA}" stroke="none"'          # relleno macizo


def pol(cx: float, cy: float, r: float, grados: float) -> tuple[float, float]:
    a = math.radians(grados - 90)
    return cx + r * math.cos(a), cy + r * math.sin(a)


def estrella(n: int, r1: float, r2: float, cx=50, cy=50, giro=0) -> str:
    pts = [pol(cx, cy, r1 if i % 2 == 0 else r2, giro + i * 180 / n) for i in range(2 * n)]
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"


def rayos(n: int, r1: float, r2: float, cx=50, cy=50, giro=0) -> str:
    s = ""
    for i in range(n):
        x1, y1 = pol(cx, cy, r1, giro + i * 360 / n); x2, y2 = pol(cx, cy, r2, giro + i * 360 / n)
        s += f"M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}"
    return s


def espiral(cx: float, cy: float, r: float, vueltas: float = 2.25, giro: float = 0, sentido: int = 1) -> str:
    pts = []
    for i in range(0, 121):
        t = i / 120
        a = giro + sentido * t * vueltas * 360
        pts.append(pol(cx, cy, r * t, a))
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts)


def anillo(n: int, r: float, rp: float, cx=50, cy=50, desde=0, hasta=360, relleno=True) -> str:
    paso = (hasta - desde) / (n if hasta - desde >= 360 else n - 1)
    out = ""
    for i in range(n):
        x, y = pol(cx, cy, r, desde + i * paso)
        out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rp}" {F if relleno else ""}/>'
    return out


def P(d: str, extra: str = "") -> str:
    return f'<path d="{d}" {extra}/>'


# ---- Biblioteca de motivos: nombre → (SVG interior, descripción) --------------------------
M: dict[str, tuple[str, str]] = {}


def motivo(nombre: str, descripcion: str):
    def reg(f):
        M[nombre] = (f(), descripcion)
        return f
    return reg


@motivo("ocre", "ocre grabado con trama cruzada (Blombos)")
def _():
    return P("M22 34h56v32H22Z") + P("M28 61L40 39M40 61L52 39M52 61L64 39M64 61L72 46M28 39L40 61M40 39L52 61M52 39L64 61M64 39L72 54", 'stroke-width="3.5"') + P("M22 50h56", 'stroke-width="3"')


@motivo("cuentas", "collar de cuentas de concha perforada")
def _():
    return P("M20 30C24 62 38 76 50 76C62 76 76 62 80 30", 'stroke-width="2.5"') + anillo(9, 30, 5.2, 50, 44, 115, 245, False)


@motivo("sepultura", "enterramiento en posición fetal con ofrendas")
def _():
    return (P("M14 50C14 30 34 22 50 22C66 22 86 30 86 50C86 70 66 80 50 80C34 80 14 70 14 50Z")
            + f'<circle cx="35" cy="42" r="6" {F}/>' + P("M41 46C52 44 60 46 62 54C64 62 56 64 50 60M58 60C62 66 58 70 50 70", 'stroke-width="5"')
            + P("M70 36l4-6M75 40l6-3", 'stroke-width="3.5"'))


@motivo("mano", "mano en negativo del arte rupestre")
def _():
    dedos = "M39 54L34 25M46 50L45 18M54 50L56 19M61 54L67 28M35 68L21 52"
    puntos = anillo(14, 40, 1.8, 50, 52, 0, 360)
    return f'<ellipse cx="49" cy="66" rx="17" ry="18" {F}/>' + P(dedos, f'stroke-width="9.5"') + puntos


@motivo("venus", "figurilla femenina paleolítica")
def _():
    return (f'<circle cx="50" cy="19" r="8" {F}/>'
            + P("M50 29C32 30 25 46 31 58C35 66 42 74 44 86H56C58 74 65 66 69 58C75 46 68 30 50 29Z")
            + P("M40 45C44 50 48 50 50 46C52 50 56 50 60 45M36 60C44 64 56 64 64 60", 'stroke-width="3.5"'))


@motivo("pilar_t", "pilar en T de Göbekli Tepe")
def _():
    return P("M24 16H76V32H60V86H40V32H24Z") + P("M40 46C46 52 48 56 47 64M60 46C54 52 52 56 53 64M44 66H56", 'stroke-width="3.5"') + P("M28 24h8M42 24h16M64 24h8", 'stroke-width="3"')


@motivo("bucraneo", "bucráneo de los santuarios de Çatalhöyük")
def _():
    return (P("M18 22C18 46 34 52 50 52C66 52 82 46 82 22")
            + P("M36 50L41 80Q50 88 59 80L64 50") + f'<circle cx="43" cy="62" r="3.5" {F}/><circle cx="57" cy="62" r="3.5" {F}/>')


@motivo("trilito", "trilito megalítico")
def _():
    return P("M16 22H84V34H16Z") + P("M24 34V84H38V34M62 34V84H76V34") + P("M10 86H90", 'stroke-width="3"')


@motivo("espiral_doble", "espirales de los templos de Malta")
def _():
    return P(espiral(32, 50, 18, 2, 90, 1)) + P(espiral(68, 50, 18, 2, 270, 1)) + P("M14 50C14 74 86 74 86 50", 'stroke-width="3"')


@motivo("serpiente", "serpiente arcoíris")
def _():
    return (P("M12 70C22 40 36 38 44 56S64 78 72 50S84 26 90 32", 'stroke-width="9"')
            + P("M12 70C22 40 36 38 44 56S64 78 72 50S84 26 90 32", f'stroke="#f6f3ea" stroke-width="3"') + f'<circle cx="89" cy="31" r="6" {F}/>')


@motivo("circulos_punteados", "círculos concéntricos y puntos de la pintura del Sueño")
def _():
    return ('<circle cx="50" cy="50" r="7"/><circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="25"/>' + anillo(18, 34, 2.6) + anillo(26, 42, 1.8))


@motivo("danzante", "danzante en trance del arte rupestre san")
def _():
    return (f'<circle cx="56" cy="20" r="6" {F}/>' + P("M54 27C48 38 44 48 46 58M46 58L36 84M46 58L58 70L56 86", 'stroke-width="6"')
            + P("M52 34L70 26M50 38C42 30 36 30 30 34", 'stroke-width="5"') + P("M66 22l6 6M70 30l6 2", 'stroke-width="3"'))


@motivo("sankofa", "sankofa (adinkra)")
def _():
    return (P("M50 86C34 74 20 62 20 44C20 30 34 24 44 32C50 37 47 46 40 45C34 44 35 36 40 36")
            + P("M50 86C66 74 80 62 80 44C80 30 66 24 56 32C50 37 53 46 60 45C66 44 65 36 60 36")
            + P("M50 30V20M44 64C46 70 54 70 56 64", 'stroke-width="4"'))


@motivo("taburete", "taburete ancestral")
def _():
    return P("M18 30Q50 42 82 30") + P("M22 76Q50 66 78 76") + P("M30 36V72M70 36V72M42 39V69H58V39", 'stroke-width="5"') + P("M18 30V24M82 30V24", 'stroke-width="4"')


@motivo("tambor", "tambor ritual")
def _():
    return ('<ellipse cx="50" cy="22" rx="24" ry="8"/>' + P("M26 22C26 46 38 54 40 86H60C62 54 74 46 74 22")
            + P("M30 30L44 48L56 30L68 48M40 86h20", 'stroke-width="3"'))


@motivo("tambor_chaman", "tambor chamánico de marco")
def _():
    return ('<circle cx="50" cy="50" r="34"/>' + f'<circle cx="50" cy="34" r="6" {F}/>' + P(rayos(8, 8, 12, 50, 34), 'stroke-width="2.5"')
            + P("M24 54H76M50 60V78M44 66L50 60L56 66M36 60V76M64 60V76M32 68H40M60 68H68", 'stroke-width="3.5"'))


@motivo("tambor_sami", "tambor sami con el sol romboidal")
def _():
    return ('<ellipse cx="50" cy="50" rx="30" ry="36"/>' + P("M50 36L64 50L50 64L36 50Z") + P(rayos(4, 14, 26, 50, 50, 0), 'stroke-width="3.5"')
            + P("M26 26l6 6M74 26l-6 6M26 74l6-6M74 74l-6-6", 'stroke-width="3"'))


@motivo("arpa", "arpa ngombi del rito bwiti")
def _():
    return P("M30 84C30 44 48 22 78 18") + P("M24 84H42V56H30") + P("M34 56L58 26M38 70L68 22M40 80L74 20", 'stroke-width="2.5"')


@motivo("odaa", "odaa, el sicómoro sagrado oromo")
def _():
    return P("M14 46C14 30 32 22 50 24C68 22 86 30 86 46C86 56 70 58 50 56C30 58 14 56 14 46Z", F) + P("M45 56L42 84H58L55 56Z", F) + P("M30 86H70", 'stroke-width="3"')


@motivo("cuernos", "cuernos de lira del ganado nilótico")
def _():
    return P("M36 70C26 54 18 34 28 14") + P("M64 70C74 54 82 34 72 14") + P("M36 66C40 76 44 84 50 88C56 84 60 76 64 66Q50 58 36 66Z") + f'<circle cx="44" cy="72" r="2.5" {F}/><circle cx="56" cy="72" r="2.5" {F}/>'


@motivo("escudo_masai", "escudo masái")
def _():
    return '<ellipse cx="50" cy="50" rx="22" ry="38"/>' + P("M50 12V88") + P("M36 30Q50 38 64 30M36 70Q50 62 64 70", 'stroke-width="3.5"') + f'<circle cx="50" cy="50" r="6" {F}/>'


@motivo("kanaga", "máscara kanaga dogona")
def _():
    return P("M44 10H56V24H44Z") + P("M50 24V88M24 40H76M24 40V26M76 40V26M24 66H76M24 66V80M76 66V80", 'stroke-width="6"')


@motivo("pintadera", "pintadera canaria")
def _():
    return P("M42 10H58V20H42Z") + P("M20 20H80V80H20Z") + P("M30 30H70V70H30Z", 'stroke-width="3.5"') + P("M30 50L40 40L50 50L60 40L70 50M30 60L40 50L50 60L60 50L70 60", 'stroke-width="3"')


@motivo("ikenga", "ikenga igbo")
def _():
    return (P("M40 38C30 30 30 16 40 10M60 38C70 30 70 16 60 10") + '<circle cx="50" cy="44" r="9"/>'
            + P("M40 54H60L62 76H38Z") + P("M30 76H70V86H30Z"))


@motivo("piramide_meroe", "pirámides de Meroe")
def _():
    return P("M30 84L46 22L62 84") + P("M52 84L66 36L80 84", 'stroke-width="4"') + P("M38 84V72H50V84", 'stroke-width="4"') + P("M14 86H88", 'stroke-width="3"')


@motivo("aloalo", "poste funerario aloalo malgache")
def _():
    return P("M50 30V88") + P("M26 18C34 30 66 30 74 18") + P("M40 44L50 36L60 44L50 52Z M40 64L50 56L60 64L50 72Z", 'stroke-width="4"') + f'<circle cx="50" cy="28" r="5" {F}/>'


@motivo("yoonir", "Yoonir, la estrella serer")
def _():
    return P(estrella(5, 38, 15)) + '<circle cx="50" cy="52" r="6"/>'


@motivo("ave_zimbabue", "ave de esteatita del Gran Zimbabue")
def _():
    return (P("M44 60H58V88H44Z") + P("M40 58C36 46 38 34 46 26C50 22 56 22 58 26L66 24L60 30C62 38 60 48 56 58Z")
            + f'<circle cx="53" cy="30" r="2.5" {F}/>' + P("M46 66h12M46 74h12", 'stroke-width="3"'))


@motivo("ouroboros", "serpiente que se muerde la cola (Dan)")
def _():
    return P("M50 18A32 32 0 1 1 22 34", 'stroke-width="8"') + P("M14 34L24 26L30 36Z", F) + P("M50 18A32 32 0 1 1 22 34", 'stroke="#f6f3ea" stroke-width="2" stroke-dasharray="3 5"')


@motivo("opon", "tablero adivinatorio opon ifá")
def _():
    return ('<circle cx="50" cy="52" r="34"/><circle cx="50" cy="52" r="20" stroke-width="3"/>'
            + P("M42 18L50 8L58 18Z", F) + P(rayos(4, 22, 32, 50, 52, 45), 'stroke-width="3"') + anillo(8, 27, 1.8, 50, 52, 22.5))


@motivo("escudo_zulu", "escudo y lanza zulúes")
def _():
    return P("M50 6V94", 'stroke-width="4"') + '<ellipse cx="50" cy="50" rx="20" ry="36"/>' + f'<circle cx="42" cy="36" r="3" {F}/><circle cx="58" cy="46" r="3" {F}/><circle cx="42" cy="58" r="3" {F}/><circle cx="58" cy="68" r="3" {F}/>'


@motivo("estrella8", "estrella de ocho puntas de Ishtar y Shamash")
def _():
    return '<circle cx="50" cy="50" r="38" stroke-width="3"/>' + P(estrella(8, 33, 13), F)


@motivo("rayo", "haz de rayos del dios de la tormenta")
def _():
    return P("M50 88V56M50 56L34 44L42 34L30 14M50 56L50 40L58 28L50 10M50 56L66 44L58 34L70 14", 'stroke-width="5.5"') + P("M40 88H60", 'stroke-width="4"')


@motivo("disco_hitita", "estandarte solar de Alaca Höyük")
def _():
    return ('<circle cx="50" cy="48" r="28"/>' + P("M30 34H70M26 48H74M30 62H70M38 24V72M50 20V76M62 24V72", 'stroke-width="2.5"')
            + anillo(12, 34, 3.5, 50, 48, 0, 360, False) + P("M50 82V92M40 92H60", 'stroke-width="4"'))


@motivo("zigurat", "zigurat escalonado")
def _():
    return P("M14 84H86V68H76V52H64V36H36V52H24V68H14Z") + P("M44 84V60H56V84M50 36V22", 'stroke-width="4"') + P("M44 22h12", 'stroke-width="4"')


@motivo("ojo_idolo", "ídolo de ojos mesopotámico")
def _():
    return '<circle cx="38" cy="38" r="12"/><circle cx="62" cy="38" r="12"/>' + f'<circle cx="38" cy="38" r="4.5" {F}/><circle cx="62" cy="38" r="4.5" {F}/>' + P("M36 52L40 86H60L64 52Z")


@motivo("arbol_sagrado", "árbol sagrado de Asherá")
def _():
    return (P("M50 88V30") + P("M50 32C40 18 26 20 22 30M50 32C60 18 74 20 78 30M50 48C38 40 26 44 24 54M50 48C62 40 74 44 76 54M50 64C40 58 32 62 30 70M50 64C60 58 68 62 70 70", 'stroke-width="4"')
            + f'<circle cx="50" cy="22" r="6" {F}/>' + P("M36 88H64", 'stroke-width="4"'))


@motivo("creciente_disco", "creciente y disco de la Arabia preislámica")
def _():
    return P("M22 40C26 66 74 66 78 40C70 56 30 56 22 40Z", F) + '<circle cx="50" cy="34" r="12"/>'


@motivo("betilo", "betilo, piedra sagrada con ojos")
def _():
    return P("M32 18H68V84H32Z") + P("M38 38H46V44H38ZM54 38H62V44H54Z", F) + P("M50 48V62", 'stroke-width="4"') + P("M22 86H78", 'stroke-width="3"')


@motivo("fuego", "fuego sagrado sobre el altar")
def _():
    return (P("M50 14C58 26 70 32 66 48C64 56 58 60 50 60C42 60 36 56 34 48C30 34 44 30 50 14Z", F)
            + P("M50 34C54 40 58 44 56 50C54 54 46 54 44 50C42 44 48 40 50 34Z", 'fill="#f6f3ea" stroke="none"')
            + P("M30 62H70L64 72H36ZM40 72V86H60V72M32 86H68"))


@motivo("gorro_frigio", "gorro frigio")
def _():
    return P("M26 78C24 50 32 26 56 20C70 17 80 28 76 40C72 34 64 34 62 40C68 52 72 66 74 78Z") + P("M24 78H76V86H24Z")


@motivo("gorro_estrellas", "gorro frigio y las siete estrellas de Mitra")
def _():
    return P("M28 80C26 56 34 36 54 30C66 27 74 36 72 46C68 41 62 41 60 46C66 56 68 68 70 80Z") + P("M26 80H72V87H26Z") + anillo(7, 38, 2.6, 50, 50, -70, 70)


@motivo("corona_mural", "corona mural de la Gran Madre")
def _():
    return P("M18 76V40H28V30H38V40H46V26H54V40H62V30H72V40H82V76Z") + P("M18 60H82", 'stroke-width="3"') + P("M44 76V64H56V76", 'stroke-width="3.5"')


@motivo("cubo", "cubo sagrado de piedra")
def _():
    return P("M50 18L82 32V68L50 82L18 68V32Z") + P("M18 32L50 46L82 32M50 46V82") + P("M18 44L50 58L82 44", 'stroke-width="4"')


@motivo("monte", "monte sagrado con el altar en la cima")
def _():
    return P("M10 82L40 34L52 52L62 40L90 82Z") + P("M34 34H46V26H34Z", F) + P("M24 82L34 66", 'stroke-width="3"')


@motivo("pavo_real", "Melek Taus, el Ángel Pavo Real")
def _():
    s = ""
    for i in range(7):
        x, y = pol(50, 74, 38, -66 + i * 22)
        s += P(f"M50 74L{x:.1f} {y:.1f}", 'stroke-width="2.5"') + f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" {F}/>'
    return s + P("M50 88C42 80 44 66 50 60C54 54 54 46 50 42", 'stroke-width="5"') + f'<circle cx="50" cy="38" r="5" {F}/>' + P("M50 33V26M46 34L42 28M54 34L58 28", 'stroke-width="2.5"')


@motivo("tambur", "laúd tambur del culto yarsán")
def _():
    return '<ellipse cx="50" cy="70" rx="18" ry="16"/>' + P("M50 54V12") + P("M44 16H56M44 24H56", 'stroke-width="4"') + f'<circle cx="50" cy="70" r="4" {F}/>' + P("M46 54V86M54 54V86", 'stroke-width="1.5"')


@motivo("creciente_estandarte", "creciente del dios lunar Sin sobre su estandarte")
def _():
    return P("M30 22C30 44 70 44 70 22C64 34 36 34 30 22Z", F) + P("M50 40V88") + P("M40 52L34 60M60 52L66 60", 'stroke-width="3.5"') + P("M38 88H62", 'stroke-width="4"')


@motivo("rueda_solar", "rueda solar del cielo diurno")
def _():
    return '<circle cx="50" cy="50" r="32"/>' + P(rayos(6, 0, 32)) + f'<circle cx="50" cy="50" r="6" {F}/>' + P(rayos(12, 36, 44), 'stroke-width="3"')


@motivo("auseklis", "estrella del alba báltica")
def _():
    return P("M30 30H70V70H30Z") + P("M50 22L78 50L50 78L22 50Z") + f'<circle cx="50" cy="50" r="5" {F}/>'


@motivo("reloj", "Dios relojero de la razón ilustrada")
def _():
    return '<circle cx="50" cy="52" r="32"/>' + P(rayos(12, 26, 30, 50, 52), 'stroke-width="3"') + P("M50 52V32M50 52L64 60", 'stroke-width="5"') + P("M44 14H56M50 14V20", 'stroke-width="4"')


@motivo("ojo_triangulo", "ojo radiante en el triángulo")
def _():
    return P("M50 18L84 78H16Z") + P("M34 58C42 48 58 48 66 58C58 68 42 68 34 58Z", 'stroke-width="3.5"') + f'<circle cx="50" cy="58" r="4.5" {F}/>' + P(rayos(9, 42, 48, 50, 54, -80), 'stroke-width="2.5"')


@motivo("tirso", "tirso coronado de piña y hiedra")
def _():
    return (P("M38 88L60 26", 'stroke-width="5"') + P("M56 12C70 14 72 30 62 32C54 34 50 20 56 12Z", F)
            + P("M48 58C40 52 30 56 30 64C38 66 46 64 48 58ZM54 42C60 34 70 36 72 42C66 48 58 48 54 42Z", F))


@motivo("espiga", "espiga de trigo de Deméter")
def _():
    s = P("M50 90V22", 'stroke-width="4"')
    for i, y in enumerate([24, 34, 44, 54, 64]):
        s += P(f"M50 {y + 8}C42 {y + 6} 38 {y} 40 {y - 4}C46 {y - 2} 50 {y + 2} 50 {y + 8}Z", F)
        s += P(f"M50 {y + 8}C58 {y + 6} 62 {y} 60 {y - 4}C54 {y - 2} 50 {y + 2} 50 {y + 8}Z", F)
    return s + P("M50 22V10", 'stroke-width="2"')


@motivo("atomos", "átomos en el vacío de Epicuro")
def _():
    return '<circle cx="50" cy="50" r="36" stroke-dasharray="2 6" stroke-width="3"/>' + f'<circle cx="38" cy="40" r="7" {F}/><circle cx="62" cy="36" r="5" {F}/><circle cx="58" cy="62" r="8" {F}/><circle cx="34" cy="64" r="4" {F}/><circle cx="50" cy="50" r="3" {F}/>'


@motivo("columnas", "pórtico de columnas, la stoa")
def _():
    return P("M14 30L50 14L86 30Z") + P("M14 34H86M18 82H82M14 88H86") + P("M26 38V78M42 38V78M58 38V78M74 38V78", 'stroke-width="6"')


@motivo("solidos", "sólido platónico")
def _():
    return P("M50 14L84 34V70L50 88L16 70V34Z") + P("M50 14L50 50M16 34L50 50L84 34M50 50L50 88", 'stroke-width="3.5"') + P("M16 70L50 50L84 70", 'stroke-width="2" stroke-dasharray="3 4"')


@motivo("emanacion", "emanación desde el Uno")
def _():
    return f'<circle cx="50" cy="50" r="7" {F}/>' + '<circle cx="50" cy="50" r="17" stroke-width="3.5"/><circle cx="50" cy="50" r="27" stroke-width="2.5"/><circle cx="50" cy="50" r="37" stroke-width="1.5"/>'


@motivo("lituus", "lituus, el báculo augural")
def _():
    return P("M44 90V40C44 22 58 14 68 20C76 26 72 38 62 36C56 35 56 28 60 26") + P("M34 90H54", 'stroke-width="4"')


@motivo("hacha", "hacha ritual de piedra")
def _():
    return P("M30 88L62 24", 'stroke-width="6"') + P("M50 30C56 18 72 12 84 16C80 28 72 40 62 46L54 40Z", F) + P("M58 24L46 18", 'stroke-width="4"')


@motivo("templo_griego", "templo griego")
def _():
    return P("M12 34L50 14L88 34Z") + P("M12 38H88M16 80H84M12 88H88") + P("M24 42V76M38 42V76M50 42V76M62 42V76M76 42V76", 'stroke-width="5"')


@motivo("puerta_leones", "puerta de los Leones de Micenas")
def _():
    return P("M14 88V40H86V88") + P("M26 40L50 16L74 40Z") + P("M46 36H54L56 18H44Z", F) + P("M34 88V54H66V88", 'stroke-width="4"')


@motivo("libro_luz", "libro abierto y luz de la razón")
def _():
    return P("M50 40C40 34 26 34 16 38V78C26 74 40 74 50 80C60 74 74 74 84 78V38C74 34 60 34 50 40Z") + P("M50 40V80") + P("M50 30V12M40 20L44 26M60 20L56 26", 'stroke-width="3.5"')


@motivo("exvoto", "exvoto íbero de bronce")
def _():
    return f'<circle cx="50" cy="18" r="7" {F}/>' + P("M50 26L34 86H66Z", F) + P("M40 40L24 26M60 40L76 26", 'stroke-width="5"')


@motivo("hexagrama_circulo", "hexagrama y círculo de la tradición esotérica")
def _():
    return '<circle cx="50" cy="50" r="38"/>' + P("M50 18L78 66H22Z") + P("M50 82L22 34H78Z") + f'<circle cx="50" cy="50" r="5" {F}/>'


@motivo("roseta", "roseta de los tesoros tracios")
def _():
    s = "".join(P(f"M50 50C{pol(50,50,18,a-20)[0]:.1f} {pol(50,50,18,a-20)[1]:.1f} {pol(50,50,30,a-12)[0]:.1f} {pol(50,50,30,a-12)[1]:.1f} {pol(50,50,36,a)[0]:.1f} {pol(50,50,36,a)[1]:.1f}C{pol(50,50,30,a+12)[0]:.1f} {pol(50,50,30,a+12)[1]:.1f} {pol(50,50,18,a+20)[0]:.1f} {pol(50,50,18,a+20)[1]:.1f} 50 50Z", 'stroke-width="3.5"') for a in range(0, 360, 45))
    return s + f'<circle cx="50" cy="50" r="7" {F}/>'


@motivo("vid", "cepa con racimo, emblema del espiritismo")
def _():
    return (P("M48 90C44 74 54 64 50 50C48 40 40 34 30 34", 'stroke-width="5"') + P("M50 50C58 40 70 40 74 30", 'stroke-width="3.5"')
            + P("M62 16C74 12 84 20 80 32C70 34 62 26 62 16Z", F) + anillo(6, 7, 4.4, 36, 58, 0, 360) + f'<circle cx="36" cy="58" r="4.4" {F}/><circle cx="36" cy="70" r="4" {F}/>')


@motivo("estrella_luna", "estrella y luna creciente")
def _():
    return P("M40 16C22 22 14 44 22 62C30 80 54 88 72 78C52 80 34 64 34 44C34 32 36 24 40 16Z", F) + P(estrella(5, 16, 6.5, 62, 42), F)


@motivo("pluma_tambor", "tambor y pluma del chamanismo moderno")
def _():
    return '<circle cx="44" cy="54" r="28"/>' + P(rayos(4, 0, 28, 44, 54, 45), 'stroke-width="2.5"') + P("M70 30C76 20 86 16 90 14C88 22 82 30 74 34Z", F) + P("M70 30L62 40", 'stroke-width="3"')


@motivo("poverty_point", "terraplenes concéntricos de Poverty Point")
def _():
    return "".join(f'<path d="M{50 - r} 74A{r} {r} 0 0 1 {50 + r} 74" stroke-width="3.5"/>' for r in (14, 22, 30, 38)) + P("M58 26L70 20L82 26Z", F) + P("M10 76H90", 'stroke-width="3"')


@motivo("punta_clovis", "punta de proyectil acanalada (Clovis)")
def _():
    return P("M50 8C64 26 68 50 62 80L56 88H44L38 80C32 50 36 26 50 8Z") + P("M50 52V86", 'stroke-width="4"') + P("M42 30L46 34M58 30L54 34M40 44L45 47M60 44L55 47", 'stroke-width="2.5"')


@motivo("estrella7", "estrella de siete puntas de los siete clanes")
def _():
    return P(estrella(7, 38, 17), F) + f'<circle cx="50" cy="50" r="5" fill="#f6f3ea" stroke="none"/>'


@motivo("totem", "poste totémico")
def _():
    return (P("M38 26H62V88H38Z") + P("M14 30C24 24 32 26 38 30M86 30C76 24 68 26 62 30", 'stroke-width="5"')
            + P("M44 10L50 4L56 10V26H44Z", F) + f'<circle cx="45" cy="38" r="3" {F}/><circle cx="55" cy="38" r="3" {F}/>'
            + P("M44 48H56M38 58H62M44 68C46 72 54 72 56 68M38 78H62", 'stroke-width="3"'))


@motivo("aguila_estrellas", "ave y estrellas de las camisas de la Danza de los Espíritus")
def _():
    return P("M50 34C40 24 24 26 12 34C26 36 36 42 44 52L50 66L56 52C64 42 74 36 88 34C76 26 60 24 50 34Z", F) + P(estrella(4, 7, 2.5, 30, 76), F) + P(estrella(4, 7, 2.5, 70, 76), F) + P(estrella(4, 6, 2.2, 50, 16), F)


@motivo("casa_larga", "casa comunal haudenosaunee")
def _():
    return P("M10 76V52C10 30 90 30 90 52V76Z") + P("M44 76V58H56V76", 'stroke-width="4"') + P("M22 44Q50 30 78 44", 'stroke-width="2.5"') + P("M38 34L36 26M62 34L64 26", 'stroke-width="3"')


@motivo("mano_mica", "mano de mica hopewell")
def _():
    return P("M36 86V54L30 30C29 26 35 24 36 28L42 48L42 18C42 14 48 14 48 18V46L52 14C52 10 58 10 58 14L56 46L62 22C63 18 69 19 68 24L62 54L74 40C77 37 81 40 79 43L64 70L60 86Z")


@motivo("mano_ojo", "mano con ojo del complejo misisipiano")
def _():
    return P("M36 86V54L30 30C29 26 35 24 36 28L42 48L42 18C42 14 48 14 48 18V46L52 14C52 10 58 10 58 14L56 46L62 22C63 18 69 19 68 24L62 54L74 40C77 37 81 40 79 43L64 70L60 86Z") + P("M40 62C46 56 54 56 60 62C54 68 46 68 40 62Z", 'stroke-width="3"') + f'<circle cx="50" cy="62" r="3" {F}/>'


@motivo("inuksuk", "inuksuk de piedras")
def _():
    return P("M42 12H58V24H42ZM26 28H74V38H26ZM38 42H62V54H38ZM36 58H46V86H36ZM54 58H64V86H54ZM30 54H70V60H30Z", F)


@motivo("arpon", "cabeza de arpón articulada")
def _():
    return P("M50 8L60 30L56 70H44L40 30Z") + P("M44 70L36 86M56 70L64 86", 'stroke-width="5"') + f'<circle cx="50" cy="44" r="4" {F}/>' + P("M50 16V30", 'stroke-width="3"')


@motivo("cauri", "concha cauri del Midewiwin")
def _():
    return '<ellipse cx="50" cy="50" rx="24" ry="36"/>' + P("M50 18C46 34 46 66 50 82", 'stroke-width="4"') + P("M44 30h-5M44 40h-6M44 50h-6M44 60h-6M44 70h-5M56 30h5M56 40h6M56 50h6M56 60h6M56 70h5", 'stroke-width="3"')


@motivo("cuatro_montanas", "círculo de las cuatro montañas sagradas")
def _():
    return ('<circle cx="50" cy="50" r="12"/>' + P("M50 6L58 20H42ZM94 50L80 58V42ZM50 94L42 80H58ZM6 50L20 42V58Z", F)
            + P("M50 24V38M76 50H62M50 76V62M24 50H38", 'stroke-width="3.5"') + '<circle cx="50" cy="50" r="30" stroke-width="2" stroke-dasharray="3 6"/>')


@motivo("zia", "sol zia de los pueblos")
def _():
    s = '<circle cx="50" cy="50" r="14"/>'
    for a in (0, 90, 180, 270):
        for k in (-9, -3, 3, 9):
            x1, y1 = pol(50, 50, 18, a); x2, y2 = pol(50, 50, 40, a)
            dx, dy = math.cos(math.radians(a)) * k, math.sin(math.radians(a)) * k
            largo = 40 if abs(k) < 5 else 33
            x2, y2 = pol(50, 50, largo, a)
            s += P(f"M{x1 + dx:.1f} {y1 + dy:.1f}L{x2 + dx:.1f} {y2 + dy:.1f}", 'stroke-width="3.5"')
    return s


@motivo("espiral_petroglifo", "espiral grabada en la roca")
def _():
    return P(espiral(50, 50, 36, 3.2, 0, 1), 'stroke-width="5"')


@motivo("ave_agua", "ave acuática de la Iglesia Nativa Americana")
def _():
    return P("M50 24C46 30 46 38 50 44C54 38 54 30 50 24Z", F) + P("M50 44C40 40 22 40 10 30C18 46 30 56 44 58L50 86L56 58C70 56 82 46 90 30C78 40 60 40 50 44Z", F) + P("M42 86H58", 'stroke-width="3"')


@motivo("campana", "campanillas del culto Shaker indio")
def _():
    return P("M50 14V22M32 70C34 44 38 26 50 26C62 26 66 44 68 70Z") + P("M24 70H76", 'stroke-width="5"') + f'<circle cx="50" cy="78" r="5" {F}/>' + P("M50 26V14", 'stroke-width="3"')


@motivo("girasol", "girasol del espiritualismo")
def _():
    return P(estrella(16, 38, 26), 'stroke-width="3"') + f'<circle cx="50" cy="50" r="18" {F}/>'


@motivo("llama", "llama sagrada")
def _():
    return P("M50 10C60 26 76 36 72 58C70 72 60 82 50 82C40 82 30 72 28 58C26 42 40 36 42 24C46 34 50 36 50 10Z", F) + P("M50 44C56 52 60 58 58 66C56 72 44 72 42 66C40 58 48 54 50 44Z", 'fill="#f6f3ea" stroke="none"') + P("M36 90H64", 'stroke-width="3"')


@motivo("mazorca", "mazorca de maíz")
def _():
    s = P("M50 10C62 22 64 60 50 80C36 60 38 22 50 10Z")
    s += P("M42 26H58M40 36H60M40 46H60M41 56H59M43 66H57M50 12V78", 'stroke-width="2.5"')
    return s + P("M50 80C42 70 28 70 20 60C30 82 44 86 50 90M50 80C58 70 72 70 80 60C70 82 56 86 50 90", F)


@motivo("ollin", "glifo ollin, el movimiento")
def _():
    return (P("M22 20C34 20 44 32 50 44C56 32 66 20 78 20C78 34 66 44 56 50C66 56 78 66 78 80C66 80 56 68 50 56C44 68 34 80 22 80C22 66 34 56 44 50C34 44 22 34 22 20Z")
            + '<circle cx="50" cy="50" r="8"/>' + f'<circle cx="50" cy="50" r="3" {F}/>')


@motivo("greca", "greca escalonada de Mitla")
def _():
    return P("M14 78H40V54H26V40H54V66H66V22H86") + P("M14 64H30V68", 'stroke-width="3"') + P("M50 54V48H40", 'stroke-width="3"')


@motivo("disco_solar", "disco solar de rayos triangulares")
def _():
    return '<circle cx="50" cy="50" r="18"/>' + P(estrella(8, 40, 22), 'stroke-width="3.5"') + f'<circle cx="50" cy="50" r="6" {F}/>'


@motivo("cabeza_colosal", "cabeza colosal olmeca")
def _():
    return (P("M24 36C24 18 76 18 76 36V66C76 82 62 90 50 90C38 90 24 82 24 66Z") + P("M24 36H76", 'stroke-width="4"')
            + P("M34 50C38 46 44 46 46 50M54 50C56 46 62 46 66 50M46 56C44 64 44 68 50 68C56 68 56 64 54 56M40 76C46 80 54 80 60 76", 'stroke-width="3.5"'))


@motivo("tlaloc", "anteojeras y colmillos de Tláloc")
def _():
    return ('<circle cx="34" cy="40" r="14"/><circle cx="66" cy="40" r="14"/>' + f'<circle cx="34" cy="40" r="5" {F}/><circle cx="66" cy="40" r="5" {F}/>'
            + P("M20 64C36 58 64 58 80 64") + P("M34 62L38 78L42 62M46 61L50 80L54 61M58 62L62 78L66 62", 'stroke-width="3.5"'))


@motivo("atlante", "atlante guerrero de Tula")
def _():
    return P("M30 14L36 26H64L70 14M38 14V24M50 10V24M62 14V24", 'stroke-width="3.5"') + P("M36 26H64V86H36Z") + P("M42 36H58M36 52H64M44 52V86M56 52V86", 'stroke-width="3"') + P("M40 64H60L56 72H44Z", F)


@motivo("voladores", "palo de los voladores")
def _():
    return P("M50 12V88") + P("M38 20H62", 'stroke-width="4"') + P("M40 20L18 60M44 20L32 72M56 20L68 72M60 20L82 60", 'stroke-width="2" stroke-dasharray="3 3"') + f'<circle cx="18" cy="62" r="4" {F}/><circle cx="32" cy="74" r="4" {F}/><circle cx="68" cy="74" r="4" {F}/><circle cx="82" cy="62" r="4" {F}/>' + P("M40 88H60", 'stroke-width="4"')


@motivo("ojo_de_dios", "ojo de Dios huichol (tsikuri)")
def _():
    return P("M50 8V92M8 50H92", 'stroke-width="3"') + P("M50 14L86 50L50 86L14 50Z") + P("M50 26L74 50L50 74L26 50Z", 'stroke-width="4"') + P("M50 38L62 50L50 62L38 50Z", F)


@motivo("cruz_maya", "cruz foliada, el árbol del mundo maya")
def _():
    return (P("M50 88V18M24 42H76", 'stroke-width="7"') + P("M50 18C44 10 44 6 50 4C56 6 56 10 50 18ZM24 42C16 36 12 36 10 42C12 48 16 48 24 42ZM76 42C84 36 88 36 90 42C88 48 84 48 76 42Z", F)
            + P("M40 88H60", 'stroke-width="4"'))


@motivo("guadana", "guadaña y globo terráqueo")
def _():
    return P("M30 90L62 14", 'stroke-width="5"') + P("M62 14C46 12 32 20 24 32C38 26 50 24 60 24Z", F) + '<circle cx="66" cy="70" r="14"/>' + P("M52 70H80M66 56C60 64 60 76 66 84M66 56C72 64 72 76 66 84", 'stroke-width="2.5"')


@motivo("eleke", "collares de cuentas (elekes)")
def _():
    return anillo(16, 36, 4) + anillo(12, 24, 3.4, 50, 50, 15, 375, False) + f'<circle cx="50" cy="50" r="6" {F}/>'


@motivo("nganga", "nganga, la caldera de poder")
def _():
    return P("M20 44H80C80 70 66 86 50 86C34 86 20 70 20 44Z") + P("M30 44L22 14M42 44L38 10M54 44L58 8M66 44L76 16", 'stroke-width="4"') + P("M24 56H76", 'stroke-width="3"')


@motivo("ireme", "íreme, el danzante enmascarado abakuá")
def _():
    return (P("M50 6L64 40H36Z") + f'<circle cx="50" cy="6" r="3.5" {F}/>' + f'<circle cx="45" cy="30" r="3" {F}/><circle cx="55" cy="30" r="3" {F}/>'
            + P("M36 40H64L70 88H30Z") + P("M32 56H68M31 72H69", 'stroke-width="2.5" stroke-dasharray="2 4"') + P("M36 44L18 58M64 44L82 58", 'stroke-width="4"'))


@motivo("cemi", "cemí de tres puntas")
def _():
    return P("M10 70C24 70 34 60 50 24C66 60 76 70 90 70C80 80 20 80 10 70Z") + f'<circle cx="34" cy="62" r="4" {F}/>' + P("M28 54C32 50 38 52 40 56M50 32V46", 'stroke-width="3"')


@motivo("avion", "avión del culto cargo")
def _():
    return P("M50 8C54 8 56 14 56 22V38L88 54V62L56 54V76L66 84V90L50 86L34 90V84L44 76V54L12 62V54L44 38V22C44 14 46 8 50 8Z", F)


@motivo("cruz_poste", "cruz roja sobre poste (John Frum)")
def _():
    return P("M50 90V44", 'stroke-width="5"') + P("M40 10H60V24H74V44H60V58H40V44H26V24H40Z", F) + P("M36 90H64", 'stroke-width="4"')


@motivo("kahili", "kāhili, estandarte de plumas")
def _():
    return P("M50 48V92", 'stroke-width="5"') + P("M34 14C34 6 66 6 66 14V44C66 52 34 52 34 44Z", F) + P("M38 20H62M38 30H62M38 40H62", 'stroke="#f6f3ea" stroke-width="2"')


@motivo("koru", "koru, el brote de helecho")
def _():
    return P(espiral(54, 40, 26, 1.6, 200, -1), 'stroke-width="7"') + P("M40 64C38 74 40 84 46 92", 'stroke-width="7"')


@motivo("vasija_lapita", "vasija lapita de decoración dentada")
def _():
    return (P("M22 30H78L72 52C70 72 62 84 50 84C38 84 30 72 28 52Z") + P("M30 40L36 50L42 40L48 50L54 40L60 50L66 40L72 50", 'stroke-width="3" stroke-dasharray="2 3"')
            + P("M32 62C38 56 44 68 50 62C56 56 62 68 68 62", 'stroke-width="3" stroke-dasharray="2 3"'))


@motivo("garamut", "tambor de hendidura melanesio")
def _():
    return P("M30 14H70V86H30Z") + P("M50 24V76", 'stroke-width="7"') + P("M30 14C36 6 64 6 70 14", 'stroke-width="4"') + f'<circle cx="40" cy="24" r="3" {F}/><circle cx="60" cy="24" r="3" {F}/>'


@motivo("carta_varas", "carta de navegación de varas")
def _():
    return P("M14 14H86V86H14Z", 'stroke-width="3"') + P("M14 14L86 86M86 14L14 86M50 14V86M14 50H86", 'stroke-width="2.5"') + P("M22 60C40 40 60 40 78 60M22 40C40 60 60 60 78 40", 'stroke-width="3"') + f'<circle cx="50" cy="50" r="5" {F}/><circle cx="32" cy="32" r="4" {F}/><circle cx="70" cy="70" r="4" {F}/><circle cx="70" cy="30" r="4" {F}/>'


@motivo("bai", "bai, la casa de reunión de Palaos")
def _():
    return P("M10 52L50 10L90 52Z") + P("M20 52V84H80V52") + P("M30 40H70M38 30H62", 'stroke-width="3"') + P("M44 84V64H56V84", 'stroke-width="3.5"')


@motivo("niu", "poste niu del culto Pai Mārire")
def _():
    return P("M50 8V92", 'stroke-width="5"') + P("M30 26H70M36 42H64", 'stroke-width="4"') + P("M30 26L18 70M70 26L82 70M36 42L28 80M64 42L72 80", 'stroke-width="2"') + P("M38 92H62", 'stroke-width="4"')


@motivo("casa_espiritus_alta", "casa de los espíritus de fachada alta")
def _():
    return P("M50 6L80 70H20Z") + P("M14 70H86V88H14Z") + '<circle cx="50" cy="44" r="10"/>' + f'<circle cx="46" cy="42" r="2.5" {F}/><circle cx="54" cy="42" r="2.5" {F}/>' + P("M38 60H62", 'stroke-width="3"')


@motivo("tiki", "tiki polinesio")
def _():
    return (P("M24 30C24 12 76 12 76 30V80H24Z") + '<ellipse cx="38" cy="38" rx="9" ry="7"/><ellipse cx="62" cy="38" rx="9" ry="7"/>'
            + f'<circle cx="38" cy="38" r="3" {F}/><circle cx="62" cy="38" r="3" {F}/>' + P("M46 46C44 54 56 54 54 46M34 62H66C62 72 38 72 34 62Z", 'stroke-width="3.5"') + P("M18 86H82", 'stroke-width="4"'))


@motivo("mano_alzada", "mano alzada (ringa tū)")
def _():
    return P("M36 90V58L30 34C29 30 35 28 36 32L42 50L42 20C42 16 48 16 48 20V48L52 16C52 12 58 12 58 16L56 48L62 24C63 20 69 21 68 26L62 56L72 44C75 41 79 44 77 47L64 72L60 90Z") + P("M30 90H66", 'stroke-width="4"')


@motivo("serge", "serge, el poste ritual yakuto")
def _():
    return P("M42 30H58V88H42Z") + P("M38 40H62M38 54H62M38 68H62", 'stroke-width="4"') + P("M42 30C40 18 46 10 56 8C60 14 58 22 58 30", F) + P("M30 88H70", 'stroke-width="4"')


@motivo("sol_luna", "sol y luna de la estepa")
def _():
    return f'<circle cx="50" cy="56" r="14" {F}/>' + P("M34 24C38 34 62 34 66 24C60 30 40 30 34 24Z", F) + P(rayos(12, 20, 28, 50, 56), 'stroke-width="3"')


@motivo("ciervo_escita", "ciervo de oro escita")
def _():
    return (P("M16 70C26 58 46 56 66 60L76 52C80 48 86 50 84 56L78 66C70 74 50 78 30 76Z", F)
            + P("M74 52C70 40 62 34 54 30M70 44C64 40 58 38 52 38M66 36L60 24M58 30L46 24M50 26L40 18", 'stroke-width="3.5"'))


@motivo("ovoo", "ovoo, el montículo sagrado")
def _():
    return P("M16 84L36 52H64L84 84Z") + P("M30 64H70M24 74H76", 'stroke-width="3"') + P("M50 52V10", 'stroke-width="4"') + P("M50 14L68 20L50 26M50 28L64 32L50 36", F)


@motivo("huella_oso", "huella de oso")
def _():
    return P("M30 58C30 46 70 46 70 58C72 74 62 84 50 84C38 84 28 74 30 58Z", F) + f'<ellipse cx="26" cy="40" rx="6" ry="8" {F}/><ellipse cx="38" cy="28" rx="6" ry="8" {F}/><ellipse cx="50" cy="24" rx="6" ry="8" {F}/><ellipse cx="62" cy="28" rx="6" ry="8" {F}/><ellipse cx="74" cy="40" rx="6" ry="8" {F}/>'


@motivo("ovillo", "ovillo del destino de los ajivikas")
def _():
    return '<circle cx="40" cy="40" r="24"/>' + P("M20 32C30 40 50 40 62 30M18 46C30 52 50 52 62 44M28 22C34 32 36 50 32 62M44 16C50 28 52 50 46 64", 'stroke-width="2.5"') + P("M60 56C70 66 66 76 78 80C86 82 88 88 84 92", 'stroke-width="3.5"')


@motivo("kalasha", "kalasha, la vasija ritual")
def _():
    return (P("M32 46C24 56 26 76 36 84H64C74 76 76 56 68 46Z") + P("M36 46H64V38H36Z") + '<circle cx="50" cy="26" r="10"/>'
            + P("M40 38C34 30 28 30 24 34M60 38C66 30 72 30 76 34", 'stroke-width="4"') + P("M36 64H64", 'stroke-width="3"'))


@motivo("cuatro_elementos", "los cuatro elementos de los materialistas")
def _():
    return (P("M16 16H84V84H16ZM50 16V84M16 50H84", 'stroke-width="3"') + P("M33 26C39 32 39 38 33 44C27 38 27 32 33 26Z", F)
            + P("M58 38C62 30 66 30 70 38S78 46 80 38", 'stroke-width="3"') + P("M22 76L33 58L44 76Z", F) + P("M56 66C64 58 76 62 74 70C72 76 64 74 66 68", 'stroke-width="3"'))


@motivo("kolam", "kolam de puntos")
def _():
    pts = "".join(f'<circle cx="{x}" cy="{y}" r="3" {F}/>' for x in (30, 50, 70) for y in (30, 50, 70))
    return pts + P("M50 14C66 14 70 30 60 40C70 30 86 34 86 50C86 66 70 70 60 60C70 70 66 86 50 86C34 86 30 70 40 60C30 70 14 66 14 50C14 34 30 30 40 40C30 30 34 14 50 14Z", 'stroke-width="3.5"')


@motivo("sello_hoja", "sello del valle del Indo con hoja de pipal")
def _():
    return P("M16 16H84V84H16Z") + P("M50 30C66 40 66 62 50 76C34 62 34 40 50 30ZM50 30V24M50 40V76", 'stroke-width="3.5"') + P("M24 24h6M34 24h4M62 24h4M70 24h6", 'stroke-width="3"')


@motivo("circulo_vacio", "círculo de la vacuidad")
def _():
    return '<circle cx="50" cy="50" r="36" stroke-width="7"/><circle cx="50" cy="50" r="22" stroke-width="1.5" stroke-dasharray="2 5"/>'


@motivo("ocho_anillos", "los ocho niveles de conciencia")
def _():
    return "".join(f'<circle cx="50" cy="50" r="{r}" stroke-width="{w}"/>' for r, w in ((40, 2), (35, 2), (30, 2), (25, 2.5), (20, 2.5), (15, 3), (10, 3))) + f'<circle cx="50" cy="50" r="4.5" {F}/>'


@motivo("altar_halcon", "altar del fuego en forma de halcón")
def _():
    return (P("M50 14L58 30H76L92 40L76 46H60V70L68 86H32L40 70V46H24L8 40L24 30H42Z")
            + P("M42 30V46M58 30V46M40 58H60M24 38H76", 'stroke-width="2.5"'))


@motivo("dos_principios", "espíritu y materia")
def _():
    return '<circle cx="34" cy="50" r="18"/>' + f'<circle cx="66" cy="50" r="18" {F}/>' + P("M10 82H90", 'stroke-width="3"')


@motivo("ciervo", "ciervo de las pinturas rupestres")
def _():
    return P("M22 60H64M22 60L18 80M30 60L28 80M56 60L58 80M64 60L68 80M64 60L72 44L80 46", 'stroke-width="5"') + P("M72 44L68 26M68 34L60 28M72 44L80 28M78 34L86 30", 'stroke-width="3.5"') + P("M22 60L14 54", 'stroke-width="4"')


@motivo("cuenco", "cuenco de limosna y bastón del asceta")
def _():
    return P("M16 52H72C72 70 60 80 44 80C28 80 16 70 16 52Z") + P("M82 10V90", 'stroke-width="4"') + P("M76 16H88", 'stroke-width="4"') + P("M30 52C30 46 58 46 58 52", 'stroke-width="3"')


@motivo("loto_sentado", "meditador en postura del loto")
def _():
    return f'<circle cx="50" cy="20" r="8" {F}/>' + P("M50 30C40 30 38 40 38 56H62C62 40 60 30 50 30Z", F) + P("M18 74C30 60 70 60 82 74C70 80 30 80 18 74Z", F) + P("M38 50L28 68M62 50L72 68", 'stroke-width="4"')


@motivo("tongkonan", "tongkonan, la casa barco toraja")
def _():
    return P("M8 22C28 42 72 42 92 22L84 50H16Z") + P("M24 50V84H76V50") + P("M24 64H76M40 50V84M60 50V84", 'stroke-width="3"')


@motivo("bulul", "bulul, guardián del arroz")
def _():
    return '<ellipse cx="50" cy="22" rx="12" ry="12"/>' + f'<circle cx="46" cy="21" r="2" {F}/><circle cx="54" cy="21" r="2" {F}/>' + P("M38 36H62V60H38Z") + P("M38 48C32 54 32 62 40 66M62 48C68 54 68 62 60 66", 'stroke-width="4"') + P("M40 60V78H60V60M30 82H70V90H30Z")


@motivo("tambor_bronce", "tambor de bronce de Dong Son")
def _():
    return '<circle cx="50" cy="50" r="40" stroke-width="3"/><circle cx="50" cy="50" r="31" stroke-width="2"/><circle cx="50" cy="50" r="22" stroke-width="2"/>' + P(estrella(12, 17, 6), F) + P(rayos(24, 33, 38), 'stroke-width="2"')


@motivo("canoa", "canoa de balancín austronesia")
def _():
    return P("M10 64C30 74 70 74 90 64L84 72C64 80 36 80 16 72Z", F) + P("M50 64V14", 'stroke-width="4"') + P("M50 16C66 26 72 44 68 60L50 58Z", F) + P("M30 66L26 86M70 66L74 86M18 86H82", 'stroke-width="3"')


@motivo("abanico", "abanico de las ceremonias de médiums")
def _():
    s = "".join(P(f"M50 82L{pol(50, 82, 60, a)[0]:.1f} {pol(50, 82, 60, a)[1]:.1f}", 'stroke-width="2.5"') for a in range(-60, 61, 15))
    return s + P(f"M{pol(50,82,60,-60)[0]:.1f} {pol(50,82,60,-60)[1]:.1f}A60 60 0 0 1 {pol(50,82,60,60)[0]:.1f} {pol(50,82,60,60)[1]:.1f}") + P(f"M{pol(50,82,30,-60)[0]:.1f} {pol(50,82,30,-60)[1]:.1f}A30 30 0 0 1 {pol(50,82,30,60)[0]:.1f} {pol(50,82,30,60)[1]:.1f}", 'stroke-width="3"') + f'<circle cx="50" cy="82" r="4" {F}/>'


@motivo("calao", "cálao, el ave sagrada dayak")
def _():
    return (P("M30 84C24 62 28 40 42 30C50 24 58 24 62 30L90 40L64 44C60 56 54 70 46 84Z") + P("M42 30C48 18 62 16 72 22L62 30", F)
            + f'<circle cx="50" cy="36" r="3" {F}/>')


@motivo("gunungan", "gunungan del teatro de sombras javanés")
def _():
    return P("M50 6C66 24 84 46 84 66C84 80 70 90 50 90C30 90 16 80 16 66C16 46 34 24 50 6Z") + P("M50 88V30M50 44L38 34M50 44L62 34M50 58L34 48M50 58L66 48M50 72L32 64M50 72L68 64", 'stroke-width="3"')


@motivo("losa", "tumba megalítica de losa")
def _():
    return P("M10 34H90L84 46H16Z", F) + P("M24 46V78M76 46V78M44 46V78M56 46V78", 'stroke-width="6"') + P("M10 82H90", 'stroke-width="4"')


@motivo("coco", "coco de ofrenda a los espíritus")
def _():
    return '<circle cx="50" cy="60" r="24"/>' + P("M28 54C38 60 62 60 72 54", 'stroke-width="6"') + P("M50 36C44 22 34 16 24 18C32 26 42 32 50 36ZM50 36C56 22 66 16 76 18C68 26 58 32 50 36Z", F)


@motivo("sol8", "sol de ocho rayos")
def _():
    s = f'<circle cx="50" cy="50" r="15" {F}/>'
    for a in range(0, 360, 45):
        s += P(f"M{pol(50,50,19,a-6)[0]:.1f} {pol(50,50,19,a-6)[1]:.1f}L{pol(50,50,40,a)[0]:.1f} {pol(50,50,40,a)[1]:.1f}L{pol(50,50,19,a+6)[0]:.1f} {pol(50,50,19,a+6)[1]:.1f}Z", F)
    return s


@motivo("casa_espiritus", "casa de los espíritus sobre columna")
def _():
    return P("M28 44L50 22L72 44Z") + P("M32 44H68V64H32Z") + P("M46 64V88H54V64", 'stroke-width="4"') + P("M24 44L22 38M76 44L78 38", 'stroke-width="3"') + P("M44 64V54H56V64", 'stroke-width="3"') + P("M36 88H64", 'stroke-width="4"')


@motivo("arroz", "espiga de arroz")
def _():
    s = P("M50 90C50 60 52 36 62 18", 'stroke-width="3.5"')
    for i, t in enumerate((0.25, 0.4, 0.55, 0.7)):
        x, y = 50 + 12 * t, 90 - 72 * t
        s += f'<ellipse cx="{x + 8:.1f}" cy="{y + 4:.1f}" rx="5" ry="3" transform="rotate(40 {x + 8:.1f} {y + 4:.1f})" {F}/>'
        s += f'<ellipse cx="{x - 7:.1f}" cy="{y + 8:.1f}" rx="5" ry="3" transform="rotate(-30 {x - 7:.1f} {y + 8:.1f})" {F}/>'
    return s + P("M50 66C38 56 26 56 18 62", 'stroke-width="3"')


@motivo("cong", "cong de jade del Neolítico chino")
def _():
    return P("M18 18H82V82H18Z") + '<circle cx="50" cy="50" r="18"/>' + P("M18 34H28M18 66H28M72 34H82M72 66H82M34 18V28M66 18V28M34 72V82M66 72V82", 'stroke-width="3.5"')


@motivo("cielo_tierra_hombre", "círculo, cuadrado y triángulo: cielo, tierra y ser humano")
def _():
    return '<circle cx="50" cy="52" r="38"/>' + P("M26 28H74V76H26Z") + P("M50 34L68 70H32Z", F)


@motivo("dogu", "figura dogū de ojos de anteojera")
def _():
    return (P("M32 20C32 10 68 10 68 20V40H32Z") + '<ellipse cx="42" cy="30" rx="7" ry="5"/><ellipse cx="58" cy="30" rx="7" ry="5"/>'
            + P("M36 40C24 46 22 70 34 76V90H46V80H54V90H66V76C78 70 76 46 64 40Z") + P("M40 54C46 60 54 60 60 54", 'stroke-width="3"'))


@motivo("loto", "flor de loto blanco")
def _():
    return (P("M50 20C60 32 60 52 50 66C40 52 40 32 50 20Z") + P("M50 66C40 56 26 50 14 50C20 62 34 68 50 66ZM50 66C60 56 74 50 86 50C80 62 66 68 50 66Z")
            + P("M50 66C42 48 30 38 22 34C24 50 36 62 50 66ZM50 66C58 48 70 38 78 34C76 50 64 62 50 66Z", 'stroke-width="3"') + P("M22 78H78", 'stroke-width="4"'))


@motivo("pergamino", "rollo de escrituras preciosas")
def _():
    return P("M22 24H78V76H22Z") + '<ellipse cx="22" cy="50" rx="6" ry="28"/><ellipse cx="78" cy="50" rx="6" ry="28"/>' + P("M34 36H66M34 46H66M34 56H66M34 66H56", 'stroke-width="3"')


@motivo("barco_olas", "junco sobre las olas, la diosa del mar")
def _():
    return P("M18 56H82L74 68H26Z", F) + P("M50 56V16", 'stroke-width="3.5"') + P("M50 18C62 24 66 38 64 52H50ZM50 26C42 30 38 40 40 52H50Z", 'stroke-width="3"') + P("M10 80C18 74 26 86 34 80S50 74 58 80S74 86 90 80", 'stroke-width="4"')


@motivo("escuadra_plomada", "escuadra y plomada, la norma de Mozi")
def _():
    return P("M22 14V82H72", 'stroke-width="7"') + P("M62 14V50", 'stroke-width="2.5"') + P("M62 50L56 62H68Z", F)


@motivo("taijitu_zhou", "diagrama del Supremo Último de Zhou Dunyi")
def _():
    return ('<circle cx="50" cy="12" r="7" stroke-width="3"/><circle cx="50" cy="32" r="10" stroke-width="3"/>' + P("M50 22A10 10 0 0 1 50 42", F)
            + f'<circle cx="38" cy="54" r="4" {F}/><circle cx="62" cy="54" r="4" {F}/><circle cx="44" cy="64" r="4" {F}/><circle cx="56" cy="64" r="4" {F}/><circle cx="50" cy="54" r="4" {F}/>'
            + '<circle cx="50" cy="80" r="8" stroke-width="3"/>' + P("M50 22V12", 'stroke-width="0"'))


@motivo("pincel", "pincel y tinta del letrado")
def _():
    return P("M70 10L42 62", 'stroke-width="6"') + P("M42 62C36 70 28 78 18 84C30 84 40 78 46 68Z", F) + '<ellipse cx="66" cy="78" rx="18" ry="8"/>'


@motivo("tres_circulos", "tres enseñanzas en una")
def _():
    return '<circle cx="50" cy="34" r="20"/><circle cx="36" cy="60" r="20"/><circle cx="64" cy="60" r="20"/>' + f'<circle cx="50" cy="52" r="4" {F}/>'


@motivo("caparazon", "caparazón oracular con grietas")
def _():
    return P("M30 14C64 8 78 30 78 50C78 74 64 90 50 90C36 90 22 74 22 50C22 30 30 14 30 14Z") + P("M40 30V44L48 44M60 30V44L52 44M40 58V72L48 72M60 58V72L52 72", 'stroke-width="3.5"') + P("M50 14V90", 'stroke-width="2"')


@motivo("caracola", "caracola horagai de los ascetas de montaña")
def _():
    return P("M20 66C20 40 44 20 66 22C80 24 86 36 80 46C74 56 60 54 58 46C56 40 62 36 66 38") + P("M20 66C30 80 54 84 70 72L80 46", 'stroke-width="5"') + P("M14 70L26 62", 'stroke-width="6"')


@motivo("lampara", "lámpara de la Madre Eterna")
def _():
    return P("M50 12C56 22 60 28 56 36C54 40 46 40 44 36C40 28 44 22 50 12Z", F) + P("M30 44H70C70 58 62 64 50 64C38 64 30 58 30 44Z") + P("M50 64V80M36 84H64", 'stroke-width="5"')


@motivo("hexagrama_yi", "hexagrama del Yijing")
def _():
    return P("M20 18H80M20 30H44M56 30H80M20 42H80M20 54H44M56 54H80M20 66H80M20 78H44M56 78H80", 'stroke-width="7" stroke-linecap="butt"')


@motivo("ding", "trípode ding de bronce")
def _():
    return P("M22 34H78C78 58 66 70 50 70C34 70 22 58 22 34Z") + P("M30 34V20H38V34M62 34V20H70V34", 'stroke-width="4"') + P("M34 66L28 88M50 70V90M66 66L72 88", 'stroke-width="5"') + P("M30 46H70", 'stroke-width="3"')


@motivo("tocado", "tocado de plumas amazónico")
def _():
    s = "".join(P(f"M50 78L{pol(50, 78, 50, a)[0]:.1f} {pol(50, 78, 50, a)[1]:.1f}", 'stroke-width="5"') for a in range(-75, 76, 25))
    return s + P("M20 80C30 70 70 70 80 80C70 88 30 88 20 80Z", F)


@motivo("cara_petroglifo", "rostro grabado en la roca")
def _():
    return '<circle cx="50" cy="52" r="26"/>' + f'<circle cx="41" cy="46" r="4" {F}/><circle cx="59" cy="46" r="4" {F}/>' + P("M42 62C46 66 54 66 58 62", 'stroke-width="3.5"') + P(rayos(9, 32, 42, 50, 52, -80), 'stroke-width="3.5"').replace("M", "M", 1)


@motivo("momia", "momia chinchorro de máscara negra")
def _():
    return P("M36 20C36 8 64 8 64 20V40L68 86H32L36 40Z") + P("M38 16H62V36H38Z", F) + P("M44 24H48M52 24H56M46 31H54", 'stroke="#f6f3ea" stroke-width="2.5"') + P("M36 52H64M34 66H66", 'stroke-width="2.5"')


@motivo("plaza_circular", "plaza circular hundida de Caral")
def _():
    return '<circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="26" stroke-width="3"/><circle cx="50" cy="50" r="16" stroke-width="2.5"/>' + P("M44 14V40H56V14M44 18H56M44 24H56M44 30H56M44 86V60H56V86M44 82H56M44 76H56M44 70H56", 'stroke-width="2.5"')


@motivo("cara_colmillos", "rostro de colmillos de Chavín")
def _():
    return (P("M20 22H80V78H20Z") + '<circle cx="36" cy="40" r="7"/><circle cx="64" cy="40" r="7"/>' + f'<circle cx="36" cy="40" r="2.5" {F}/><circle cx="64" cy="40" r="2.5" {F}/>'
            + P("M30 60H70") + P("M36 60L40 72L44 60M56 60L60 72L64 60", F) + P("M20 22C14 12 22 8 28 12M80 22C86 12 78 8 72 12", 'stroke-width="3.5"'))


@motivo("tumi", "tumi, el cuchillo ceremonial")
def _():
    return P("M20 70C20 88 80 88 80 70Z", F) + P("M44 70V40H56V70", 'stroke-width="5"') + '<circle cx="50" cy="30" r="8"/>' + P("M38 22L42 12M50 20V8M62 22L58 12", 'stroke-width="4"')


@motivo("danta", "danta, montura de la diosa María Lionza")
def _():
    return P("M14 56C14 40 30 36 50 38C66 40 78 44 82 52L90 60L84 62L80 58C78 66 70 70 60 70L62 86H54L52 70H34L32 86H24L22 68C16 66 14 62 14 56Z", F)


@motivo("vasija_estribo", "vasija de asa estribo moche")
def _():
    return P("M24 60C24 44 36 36 50 36C64 36 76 44 76 60C76 76 64 86 50 86C36 86 24 76 24 60Z") + P("M38 38C34 22 42 14 50 14C58 14 66 22 62 38M50 14V4", 'stroke-width="5"') + P("M34 60C40 54 46 66 50 60C54 54 60 66 66 60", 'stroke-width="3"')


@motivo("balsa_muisca", "balsa de oro muisca")
def _():
    return P("M10 74H90L84 84H16Z", F) + f'<circle cx="50" cy="34" r="7" {F}/>' + P("M42 44H58V72H42Z", F) + P("M50 26V14M44 28L40 18M56 28L60 18", 'stroke-width="3"') + "".join(f'<circle cx="{x}" cy="56" r="4" {F}/>' + P(f"M{x - 4} 62H{x + 4}V72H{x - 4}Z", F) for x in (22, 32, 68, 78))


@motivo("colibri", "colibrí de las líneas de Nazca")
def _():
    return P("M50 8V34M50 34C38 34 34 44 38 54L18 34L14 40L36 62C38 70 44 74 50 74C56 74 62 70 64 62L86 40L82 34L62 54C66 44 62 34 50 34ZM44 74L38 92M50 74V92M56 74L62 92", 'stroke-width="3"')


@motivo("textil", "manto textil de Paracas")
def _():
    return (P("M14 14H86V86H14Z") + P("M14 50H86M50 14V86", 'stroke-width="2.5"')
            + "".join(f'<circle cx="{x}" cy="{y - 8}" r="4" {F}/>' + P(f"M{x} {y - 4}V{y + 8}M{x - 8} {y}H{x + 8}M{x} {y + 8}L{x - 6} {y + 14}M{x} {y + 8}L{x + 6} {y + 14}", 'stroke-width="2.5"') for x, y in ((32, 30), (68, 30), (32, 66), (68, 66))))


@motivo("cruz_doble", "cruz de dos travesaños")
def _():
    return P("M50 8V92M34 28H66M24 46H76", 'stroke-width="7"')


@motivo("hoja_liana", "liana y hoja sagradas")
def _():
    return P("M30 92C24 70 40 60 36 44C32 28 46 18 60 14", 'stroke-width="4"') + P("M38 54C52 40 72 42 82 50C70 64 50 66 38 54Z", F) + P("M40 54C54 52 66 50 82 50", 'stroke="#f6f3ea" stroke-width="2"') + P("M34 32C26 22 14 24 10 30C20 38 28 38 34 32Z", F)


@motivo("piedra_huaca", "huaca, la piedra sagrada")
def _():
    return P("M30 84C24 60 30 30 50 18C70 30 76 60 70 84Z") + P("M40 46C44 42 56 42 60 46M38 60H62", 'stroke-width="3"') + P("M14 86H86", 'stroke-width="4"')


@motivo("puerta_sol", "Puerta del Sol de Tiwanaku")
def _():
    return P("M10 20H90V86H10Z") + P("M38 86V52H62V86") + P("M44 26H56V44H44Z", F) + P("M40 30L36 22M60 30L64 22M44 36H38M56 36H62", 'stroke-width="3"') + "".join(P(f"M{x} 30h6v8h-6Z", 'stroke-width="2"') for x in (16, 24, 70, 78))


@motivo("maraca", "maraca sagrada")
def _():
    return '<ellipse cx="50" cy="36" rx="20" ry="24"/>' + P("M50 60V92", 'stroke-width="6"') + P("M42 4L46 12M50 2V12M58 4L54 12", 'stroke-width="3"') + f'<circle cx="44" cy="30" r="3" {F}/><circle cx="56" cy="36" r="3" {F}/><circle cx="46" cy="44" r="3" {F}/>'


@motivo("ceiba", "ceiba sagrada de raíces tabulares")
def _():
    return P("M14 34C14 18 32 12 50 14C68 12 86 18 86 34C86 44 68 46 50 44C32 46 14 44 14 34Z", F) + P("M46 44L44 72C40 80 30 84 20 86M54 44L56 72C60 80 70 84 80 86M50 72V88", 'stroke-width="5"')


@motivo("yungdrung", "yungdrung, la esvástica levógira del bon")
def _():
    return '<circle cx="50" cy="50" r="40" stroke-width="3"/>' + P("M50 50V22H34M50 50H78V34M50 50V78H66M50 50H22V66", 'stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"') + f'<circle cx="34" cy="34" r="4" {F}/><circle cx="66" cy="34" r="4" {F}/><circle cx="66" cy="66" r="4" {F}/><circle cx="34" cy="66" r="4" {F}/>'


# ---- Asignación tradición → motivo -----------------------------------------------------
ASIGNACION = {
    # Prehistoria
    "origen": "ocre", "afr-msa": "ocre", "levante-paleo": "sepultura", "eur-paleo": "mano", "sea-paleo": "mano",
    "asn-paleo": "venus", "aso-paleo": "cuentas", "sasia-pre": "ciervo", "natuf": "pilar_t", "anat-neo": "bucraneo",
    "eur-neo": "trilito", "malta-templos": "espiral_doble", "aborigen": "circulos_punteados", "serpiente": "serpiente",
    # África
    "san": "danzante", "afr-oeste": "sankofa", "bantu": "taburete", "bori": "tambor", "zar": "tambor", "bwiti": "arpa",
    "cusita": "odaa", "waaqeffanna": "odaa", "nilo": "cuernos", "dinka": "cuernos", "masai": "escudo_masai",
    "dogon": "kanaga", "guanche": "pintadera", "igbo": "ikenga", "kush": "piramide_meroe", "malgache": "aloalo",
    "serer": "yoonir", "shona": "ave_zimbabue", "vodun": "ouroboros", "yoruba": "opon", "zulu": "escudo_zulu",
    # Oriente Próximo
    "acadia": "estrella8", "hurrita": "rayo", "hitita": "disco_hitita", "elamita": "zigurat", "ubaid": "ojo_idolo",
    "cananea": "arbol_sagrado", "arabia-pre": "creciente_disco", "nabatea": "betilo", "irania": "fuego",
    "cibeles": "corona_mural", "hanif": "cubo", "samaritanismo": "monte", "yazidismo": "pavo_real", "yarsanismo": "tambur",
    "sabeos-harran": "creciente_estandarte",
    # Europa
    "pie": "rueda_solar", "baltica": "auseklis", "deismo": "reloj", "ser-supremo": "ojo_triangulo", "dionisismo": "tirso",
    "eleusis": "espiga", "epicureismo": "atomos", "estoicismo": "columnas", "platonismo": "solidos", "neoplatonismo": "emanacion",
    "etrusca": "lituus", "finesa": "hacha", "griega": "templo_griego", "micenica": "puerta_leones", "haskala": "libro_luz",
    "ibera": "exvoto", "martinismo": "hexagrama_circulo", "mitraismo": "gorro_estrellas", "sami": "tambor_sami",
    "sol-invicto": "sol8", "tracia": "roseta", "espiritismo": "vid", "stregheria": "estrella_luna",
    # Asia central y septentrional
    "aiyy": "serge", "burjanismo": "sol_luna", "escita": "ciervo_escita", "indo-irania": "fuego", "mongol": "ovoo",
    "siberia": "tambor_chaman", "uralica": "huella_oso",
    # Asia meridional
    "ajivika": "ovillo", "brahmanismo": "kalasha", "charvaka": "cuatro_elementos", "din-i-ilahi": "disco_solar",
    "dravidica": "kolam", "indo": "sello_hoja", "madhyamaka": "circulo_vacio", "yogachara": "ocho_anillos",
    "mimamsa": "altar_halcon", "samkhya": "dos_principios", "sramana": "cuenco", "vedica": "fuego", "yoga": "loto_sentado",
    # Sudeste Asiático
    "aluk": "tongkonan", "anitismo": "bulul", "austroasiatica": "tambor_bronce", "austronesia": "canoa", "dao-mau": "abanico",
    "kaharingan": "calao", "kejawen": "gunungan", "marapu": "losa", "nat": "coco", "rizalistas": "sol8",
    "tai-phi": "casa_espiritus", "wiwitan": "arroz",
    # Asia oriental
    "bon": "yungdrung", "china-neo": "cong", "daejongismo": "cielo_tierra_hombre", "jeungsanismo": "sol_luna", "jomon": "dogu",
    "loto-blanco": "loto", "luoismo": "pergamino", "mazu": "barco_olas", "mohismo": "escuadra_plomada",
    "neoconfucianismo": "taijitu_zhou", "nuevo-confucianismo": "pincel", "sanyi": "tres_circulos", "shang": "caparazon",
    "shugendo": "caracola", "xiantiandao": "lampara", "yiguandao": "lampara", "xuanxue": "hexagrama_yi", "zhou": "ding",
    # Oceanía
    "cargo": "avion", "john-frum": "cruz_poste", "hawai": "kahili", "maori": "koru", "lapita": "vasija_lapita",
    "melanesia": "garamut", "micronesia": "carta_varas", "modekngei": "bai", "pai-marire": "niu",
    "papua": "casa_espiritus_alta", "polinesia": "tiki", "ratana": "estrella_luna", "ringatu": "mano_alzada",
    # Norteamérica
    "arcaico-nam": "poverty_point", "paleoindios": "punta_clovis", "cherokee": "estrella7", "costa-nw": "totem",
    "danza-espiritus": "aguila_estrellas", "handsome-lake": "casa_larga", "hopewell": "mano_mica", "misisipi": "mano_ojo",
    "inuit": "inuksuk", "paleoesquimal": "arpon", "midewiwin": "cauri", "navajo": "cuatro_montanas", "pueblo": "zia",
    "pueblo-anc": "espiral_petroglifo", "peyote": "ave_agua", "shaker-india": "campana", "smohalla": "tambor",
    "tenskwatawa": "llama", "espiritualismo": "girasol", "yo-soy": "llama", "neochamanismo": "pluma_tambor",
    # Mesoamérica y Caribe
    "arcaico-mes": "mazorca", "mexica": "ollin", "zapoteca": "greca", "mixteca": "disco_solar", "olmeca": "cabeza_colosal",
    "teotihuacan": "tlaloc", "tolteca": "atlante", "totonaca": "voladores", "wixarika": "ojo_de_dios",
    "maya-catolica": "cruz_maya", "santa-muerte": "guadana", "santeria": "eleke", "palo": "nganga", "abakua": "ireme",
    "garifuna": "tambor", "taino": "cemi",
    # Sudamérica
    "amazonia": "tocado", "arawak": "cara_petroglifo", "arcaico-and": "momia", "caral": "plaza_circular",
    "chavin": "cara_colmillos", "chimu": "tumi", "jurema": "hoja_liana", "maria-lionza": "danta", "moche": "vasija_estribo",
    "muisca": "balsa_muisca", "nazca": "colibri", "paracas": "textil", "santo-daime": "cruz_doble", "udv": "hoja_liana",
    "taki-onqoy": "piedra_huaca", "tambor-mina": "tambor", "tiwanaku": "puerta_sol", "tupi-guarani": "maraca",
    "umbanda": "eleke", "winti": "ceiba",
}


def svg(nombre: str) -> str:
    cuerpo, _ = M[nombre]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
            f'<g fill="none" stroke="{TINTA}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">{cuerpo}</g></svg>\n')


def main() -> None:
    forzar = "--forzar" in sys.argv
    solo = {a for a in sys.argv[1:] if not a.startswith("--")}
    escritos = 0
    for rid, nombre in ASIGNACION.items():
        carpeta = DIR_RELIGIONES / rid
        if (solo and rid not in solo) or not carpeta.exists():
            continue
        ficha_ruta = carpeta / "ficha.json"
        ficha = json.loads(ficha_ruta.read_text(encoding="utf-8"))
        propio = (ficha.get("icono") or {}).get("fuente") == "propio"
        if (carpeta / "icono.svg").exists() and not (forzar and propio):
            continue
        (carpeta / "icono.svg").write_text(svg(nombre), encoding="utf-8")
        ficha["icono"] = {"archivo": "icono.svg", "fuente": "propio", "motivo": M[nombre][1],
                          "licencia": "Dibujo original de Relitree", "autor": "Relitree"}
        ficha_ruta.write_text(json.dumps(ficha, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        escritos += 1
    print(f"Símbolos propios escritos: {escritos} (biblioteca de {len(M)} motivos)")


if __name__ == "__main__":
    main()
