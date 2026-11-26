#!/usr/bin/env python3
"""Bygger sidene på fysikklab.no som lages fra kildefiler i bygg/.

Bruk (fra rotmappa, den med index.html):
    python3 bygg/bygg.py                 bygg alle sidene
    python3 bygg/bygg.py --sjekk         bygg i en midlertidig mappe og vis hvilke sider som ville blitt endret
    python3 bygg/bygg.py opplegg/heis-mobil programmering/python-rakett    bygg bare disse

Hva som bygges:
    kilder/opplegg/*.html, kilder/sim/*.html     håndskrevne kilder med et lite hode (se lag_side.py)
    kilder/programmering/*.html                  programmeringssider. @@fil.py@@ byttes med koden i kilder/py/
    begrep.py                                    begrepstestene (opplegg/begrep-*.html)
    repetisjon.py                                repetisjonssidene (opplegg/repetisjon-*.html)
    kompetansemaal.py                            lærersiden opplegg/kompetansemaal.html (bygges sist, leser titlene fra de andre sidene)
    kilder/utdanningsvalg/*.html                 opplegget for 10. klasse på fysikklab.no/utdanningsvalg (ikke lenket fra resten av sida)
    kilder/joulekalender/*.html                  joulekalenderen på fysikklab.no/joulekalender (data og fasit ligger i Supabase, ikke her)

Etterpå: Kodeblokkene på programmeringssidene gjøres om til kjørbare Python-bokser (PY_SIDER under),
og knappen «Last ned elevark (PDF)» settes inn hvis PDF-en finnes i elevark/.
Kortene på oversiktssidene legges inn med kort.py (python3 bygg/kort.py). Det er ikke en del av byggingen.
"""
import difflib, html, importlib.util, os, re, shutil, sys, tempfile

HER = os.path.dirname(os.path.abspath(__file__))
ROT = os.path.dirname(HER)
sys.path.insert(0, HER)
from lag_side import lag as lag_side

# Programmeringssider: filnavn for nedlasting, datafiler, notatbok i JupyterLite og hvilke bokser (fra 0) som er et nytt, selvstendig program
PY_SIDER = {
    "python-grunnkurs": dict(filnavn="grunnkurs.py"),
    "python-regresjon": dict(filnavn="regresjon.py", ny=[2], notatbok="regresjon.ipynb"),
    "python-satellittbane": dict(filnavn="satellittbane.py"),
    "python-elektrisk-felt": dict(filnavn="elektrisk_felt.py"),
    "python-energi-friksjon": dict(filnavn="energi_friksjon.py", ny=[2], notatbok="energi-friksjon.ipynb"),
    "python-rakett": dict(filnavn="rakett.py", ny=[1], notatbok="rakett.ipynb"),
    "python-monte-carlo": dict(filnavn="monte_carlo.py", ny=[2], notatbok="monte-carlo.ipynb"),
    "python-biot-savart": dict(filnavn="biot_savart.py", notatbok="biot-savart.ipynb"),
    "robot": dict(filnavn="robotbil.py", filer="robot.py", ny=[1, 2, 3, 4, 5]),   # utdanningsvalg/robot.html
}

def kodeside(kilde):
    """Setter inn koden fra kilder/py/ der det står @@fil.py@@."""
    def kode(m):
        tekst = open(os.path.join(HER, "kilder", "py", m.group(1)), encoding="utf-8").read().rstrip("\n")
        return '<pre class="kode"><code>' + html.escape(tekst, quote=False) + "</code></pre>"
    return re.sub(r"@@([\w.-]+\.py)@@", kode, kilde)

def aktiver(s, navn):
    """Gjør kodeblokkene om til kjørbare Python-bokser (se js/pykjorer.js)."""
    k = PY_SIDER[navn]
    s = s.replace('  <link rel="stylesheet" href="../css/style.css">',
                  '  <link rel="stylesheet" href="../js/vendor/codemirror/codemirror.min.css">\n  <link rel="stylesheet" href="../css/style.css">', 1)
    s = s.replace("</footer>\n", """</footer>
  <script src="../js/vendor/codemirror/codemirror.min.js"></script>
  <script src="../js/vendor/codemirror/python.min.js"></script>
  <script src="../js/vendor/codemirror/matchbrackets.min.js"></script>
  <script src="../js/pykjorer.js"></script>
""", 1)
    attr = ""
    if k.get("notatbok"): attr += f' data-notatbok="../jupyter/notebooks/index.html?path={k["notatbok"]}"'
    attr += f' data-filnavn="{k["filnavn"]}"'
    if k.get("filer"): attr += f' data-filer="{k["filer"]}"'
    i = s.index('<pre class="kode">')
    d = s.rindex('<div class="tekst opplegg"', 0, i)
    s = s[:d] + '<div class="tekst opplegg py-side"' + attr + s[d + len('<div class="tekst opplegg"'):]
    nr = [0]
    def pakk(m):
        overskrifter = re.findall(r"<h[23][^>]*>(.*?)</h[23]>", s[:m.start()])
        tittel = re.sub("<[^>]+>", "", overskrifter[-1]).split(":")[0].strip() if overskrifter else "Kode"
        j = nr[0]; nr[0] += 1
        return f'<div class="py-boks" data-navn="{tittel}"{" data-ny=\"\"" if j in k.get("ny", []) else ""}>{m.group(0)}</div>'
    return re.sub(r'<pre class="kode"><code>.*?</code></pre>', pakk, s, flags=re.S)

def elevark_lenke(s, mappe, navn):
    """Samme knapp som elevark/lag_elevark.py setter inn, hvis PDF-en finnes."""
    if not os.path.exists(os.path.join(ROT, "elevark", mappe, navn + ".pdf")) or "elevark-lenke" in s:
        return s
    m = re.search(r'(<section class="oppgaver"[^>]*>\s*<h2[^>]*>.*?</h2>)(\s*)', s, re.S)
    if not m: return s
    knapp = f'<p class="elevark-lenke"><a class="knapp lys" href="../elevark/{mappe}/{navn}.pdf" download>Last ned elevark (PDF)</a></p>'
    return s[:m.end(1)] + m.group(2) + knapp + s[m.end(1):]

def modul(navn):
    spes = importlib.util.spec_from_file_location(navn, os.path.join(HER, navn + ".py"))
    m = importlib.util.module_from_spec(spes); spes.loader.exec_module(m); return m

def kilder(tmp):
    """Alle kildefilene som (mappe, navn, sti til kilde)."""
    ut = []
    for mappe in ["opplegg", "sim", "programmering", "utdanningsvalg", "joulekalender"]:
        for f in sorted(os.listdir(os.path.join(HER, "kilder", mappe))):
            if f.endswith(".html"):
                ut.append((mappe, f[:-5], os.path.join(HER, "kilder", mappe, f)))
    for mod in ["begrep", "repetisjon"]:
        d = os.path.join(tmp, mod); os.makedirs(d)
        modul(mod).bygg(d)
        ut += [("opplegg", f[:-5], os.path.join(d, f)) for f in sorted(os.listdir(d))]
    return ut

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sjekk = "--sjekk" in sys.argv
    tmp = tempfile.mkdtemp()
    sider = [k for k in kilder(tmp) if not args or f"{k[0]}/{k[1]}" in args]
    if not args or "opplegg/kompetansemaal" in args:
        sider.append(("opplegg", "kompetansemaal", None))
    endret = 0
    for mappe, navn, kilde in sider:
        if kilde is None:   # kompetansemål leser titlene fra de ferdige sidene
            d = os.path.join(tmp, "km"); os.makedirs(d, exist_ok=True)
            modul("kompetansemaal").bygg(ROT, d)
            kilde = os.path.join(d, "kompetansemaal.html")
        tekst = open(kilde, encoding="utf-8").read()
        if mappe in ("programmering", "utdanningsvalg"): tekst = kodeside(tekst)
        s = lag_side(tekst)
        if mappe in ("programmering", "utdanningsvalg") and navn in PY_SIDER: s = aktiver(s, navn)
        s = elevark_lenke(s, mappe, navn)
        mål = os.path.join(ROT, mappe, navn + ".html")
        gammel = open(mål, encoding="utf-8").read() if os.path.exists(mål) else ""
        if s != gammel:
            endret += 1
            if sjekk:
                print(f"--- {mappe}/{navn}.html ville blitt endret:")
                sys.stdout.writelines(list(difflib.unified_diff(gammel.splitlines(True), s.splitlines(True), n=1))[:40])
        if not sjekk:
            open(mål, "w", encoding="utf-8").write(s)
    shutil.rmtree(tmp)
    print(f"{len(sider)} sider bygget, {endret} {'ville blitt endret' if sjekk else 'endret'}")

if __name__ == "__main__":
    main()
