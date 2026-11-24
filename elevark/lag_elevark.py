#!/usr/bin/env python3
"""Lager elevark som PDF fra oppgavene på nettsidene, uten løsningsforslag.

Bruk (fra rotmappa, den med index.html):
    python3 elevark/lag_elevark.py            # lager .tex og PDF for alle sidene
    python3 elevark/lag_elevark.py sim/heis   # bare én side
    python3 elevark/lag_elevark.py --bare-tex # bare .tex, uten kompilering

Skriptet leser sim/, opplegg/ og programmering/, skriver LaTeX til elevark/tex/<mappe>/<navn>.tex
og PDF til elevark/<mappe>/<navn>.pdf, og legger inn en nedlastingsknapp på nettsiden.
Formler i teksten gjøres om til LaTeX automatisk. Det som ikke blir riktig, rettes i RETTELSER nederst.
Krever lualatex (TeX Live) med Libertinus-skriftene.
"""
import glob, html, os, re, shutil, subprocess, sys, tempfile
from html.parser import HTMLParser

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARK = os.path.join(ROT, "elevark")
NETT = "https://fysikklab.no/"
MAPPER = ["sim", "opplegg", "programmering"]
HOPP_OVER = {"programmering/python-ekte-data"}
# Opplegg der bare oppgavene til elevene skal med (resten er lærertekst)
KUN_OPPGAVER = {
    "opplegg/lengdekontraksjon": "Lengdekontraksjon – arbeidsark",
    "opplegg/relativistisk-bevegelsesmengde": "Relativistisk bevegelsesmengde og energi – arbeidsark",
    "opplegg/intro-bevegelsesmengde": "Bevegelsesmengde og impuls – arbeidsark",
}
# QR-koden på arbeidsarkene peker til simuleringen, ikke til lærersiden
QR = {
    "opplegg/lengdekontraksjon": ("sim/tog-og-tunnel", "Tog og tunnel"),
    "opplegg/relativistisk-bevegelsesmengde": ("sim/relativistisk-bevegelsesmengde", "Simuleringen"),
    "opplegg/intro-bevegelsesmengde": ("sim/impuls", "Myk landing"),
}
SVARHOYDE = {"programmering": "1.4cm"}

# ---------- Enkel HTML-parser som bygger et tre ----------
TOMME = {"br", "img", "input", "meta", "link", "hr", "source", "col", "wbr"}

class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.barn = tag, dict(attrs or {}), parent, []
    def klasser(self):
        return self.attrs.get("class", "").split()
    def finn(self, pred):
        for b in self.barn:
            if isinstance(b, Node):
                if pred(b): yield b
                yield from b.finn(pred)
    def tekst(self):
        return "".join(b if isinstance(b, str) else b.tekst() for b in self.barn)

class Tre(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rot = Node("rot"); self.her = self.rot
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.her); self.her.barn.append(n)
        if tag not in TOMME: self.her = n
    def handle_endtag(self, tag):
        n = self.her
        while n is not self.rot and n.tag != tag: n = n.parent
        if n is not self.rot: self.her = n.parent
    def handle_data(self, data):
        self.her.barn.append(data)

def les_tre(sti):
    t = Tre(); t.feed(open(sti, encoding="utf-8").read()); return t.rot

# ---------- Formler ----------
OPS = {"=", "±", "≈", "+", "−", "-", "·", "/", "×", "<", ">", "≤", "≥", "≪", "∝", "→", "~"}
ENHETER = {"m", "s", "kg", "g", "N", "J", "W", "kW", "MW", "MN", "kN", "V", "kV", "T", "mT", "µT", "C", "µC", "nC",
           "A", "mA", "Hz", "eV", "keV", "MeV", "GeV", "TeV", "u", "km", "cm", "mm", "nm", "µm", "m/s", "m/s²", "km/h",
           "N/C", "V/m", "Wb", "Ω", "h", "min", "ms", "µs", "ns", "ps", "Pa", "kPa", "N/m", "kg/m", "°", "%", "s²",
           "kg/s", "J/s", "år", "lysår", "m²", "m³", "rad", "rad/s", "N/kg", "mg", "kWh", "T·m", "Nm", "N·s", "Ns", "m⁻¹", "s⁻¹", "kJ", "MJ", "kg/m³", "m³/s²", "nC", "µA", "mV", "cm²", "dm²", "mm²", "km²", "cm³", "dm³"}
SIDE = [""]          # mappa til siden som lages nå, for relative lenker
ETIKETTER = set()   # bokstaver som er navn på ting (vogn A, del B) på siden som lages nå
TO_ORD_ENHETER = {"N m²/kg²", "N m²/C²", "N·m²/C²", "T m/A", "T·m/A", "kg m/s", "kg · m/s", "N/(m/s)²", "kg m²/s"}
STOPP = set("""og er på en et i å at av de du da der den det for fra har hva hvor ikke kan med men ned nå når om opp
seg som så til ut vi ved var bli mot ble oss sin sitt hun han dem ser gir får går tar dag år ett tre fem to fire
seks sju ni ti tid se ta gi få gå bør vil skal må lag lik ny nye nyt fått ha hos inn mye mer mest én før hvis via
vei eks dvs ca osv kun nok bra vel jo hel hele alt all les ark tom sum one mål set vis bruk""".split())
FUNKSJONER = {"sin", "cos", "tan", "tanh", "ln", "exp", "log"}
SUP = dict(zip("⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ⁺", "0123456789-n+"))
SUB = dict(zip("₀₁₂₃ₓₖₜₚᵧ", ["0", "1", "2", "3", "x", "k", "t", "p", "y"]))
GRESK = "ΔΣΩαβγεθλμπρστφωΦ"
STERKE = set("⊙⊗=·×²³¹⁰⁴⁵⁶⁷⁸⁹⁻ⁿ₀₁₂₃ₓₖₜₚᵧ√≈≤≥≪∝′½^\x01\x03") | set(GRESK)
TEGN_SLUTT = ".,;:?!»"

def tekstord(k):
    """Sant hvis ordet er vanlig tekst og ikke en formel."""
    ren = re.sub(r"\x01.*?\x02|\x03.*?\x04", "", k)
    for f in FUNKSJONER: ren = re.sub(r"\b%s\b" % f, "", ren)
    if re.search(r"[æøåÆØÅéÉ]", ren) or re.search(r"[A-Za-z]{4,}", ren): return True
    return re.fullmatch(r"[a-zA-Z]+", k) is not None and (k in STOPP or len(k) > 1 and k.lower() in STOPP)

def klasse(k):
    if k in OPS: return "op"
    if k in FUNKSJONER: return "var"
    if k in ENHETER and "/" in k: return "tekst"
    if not k: return "tekst"
    if tekstord(k): return "tekst"
    if any(c in STERKE for c in k): return "sterk"
    if re.fullmatch(r"[+−-]?\d+([,.]\d+)?([–-]\d+([,.]\d+)?)?(/\d+)?[°%]?", k): return "tall"
    if "|" in k and re.fullmatch(r"[A-Za-z0-9()/|·−+-]+", k): return "sterk"
    if re.fullmatch(r"[A-Za-z]\d", k): return "sterk"
    if re.fullmatch(r"\d+([,.]\d+)?[a-z]{1,2}", k): return "sterk"     # 0,80c
    if re.fullmatch(r"\(?[A-Za-z]{1,3}\)?", k): return "var"
    if re.fullmatch(r"[A-Za-z0-9()/,.+\[\]−-]+", k) and re.search(r"[A-Za-z]", k) and ("/" in k or "(" in k): return "sterk"
    return "tekst"

def enhet_tex(e):
    e = e.replace("µ", "\\symup{\\mu}").replace("⁻¹", "^{-1}").replace("²", "^{2}").replace("³", "^{3}").replace("·", "\\cdot ")
    if e == "%": return "\\%"
    if e == "°": return "^{\\circ}"
    return "\\mathrm{%s}" % e.replace(" ", "\\,")

def balansert_sqrt(s):
    while "√" in s:
        i = s.index("√")
        if i + 1 < len(s) and s[i + 1] == "(":
            d, j = 0, i + 1
            while j < len(s):
                d += {"(": 1, ")": -1}.get(s[j], 0)
                if d == 0: break
                j += 1
            s = s[:i] + "\\sqrt{" + s[i + 2:j] + "}" + s[j + 1:]
        else:
            m = re.match(r"(\\[a-z]+|[A-Za-z0-9,{}^_" + GRESK + "]+)", s[i + 1:])
            n = len(m.group(1)) if m else 0
            s = s[:i] + "\\sqrt{" + s[i + 1:i + 1 + n] + "}" + s[i + 1 + n:]
    return s

def formel_tex(s):
    def sub(m):
        x = m.group(1)
        return "_{\\mathrm{%s}}" % x if re.fullmatch(r"[A-Za-zæøå]{2,}", x) else "_{%s}" % formel_tex(x)
    s = re.sub(r"\x01(.*?)\x02", sub, s)
    s = re.sub(r"\x03(.*?)\x04", lambda m: "^{%s}" % formel_tex(m.group(1)), s)
    s = re.sub("[%s]+" % "".join(SUP), lambda m: "^{%s}" % "".join(SUP[c] for c in m.group(0)), s)
    s = re.sub("[%s]+" % "".join(SUB), lambda m: "_{%s}" % "".join(SUB[c] for c in m.group(0)), s)
    s = re.sub(r"(?<!\\)\b(%s)\b" % "|".join(sorted(FUNKSJONER, key=len, reverse=True)), r"\\\1 ", s)
    s = balansert_sqrt(s)
    s = re.sub(r"μ([sk])\b", r"μ_{\\mathrm{\1}}", s)
    for a, b in [("±", "\\pm "), ("·", "\\cdot "), ("×", "\\times "), ("≈", "\\approx "), ("≤", "\\leq "), ("≥", "\\geq "),
                 ("≪", "\\ll "), ("∝", "\\propto "), ("→", "\\to "), ("−", "-"), ("½", "\\tfrac{1}{2}"),
                 ("°", "^{\\circ}"), ("%", "\\%"), ("µ", "\\symup{\\mu}"), ("~", "\\sim "), ("#", "\\#")]:
        s = s.replace(a, b)
    s = re.sub(r"(?<![A-Za-z\\])([A-Za-z])(\d)\b", r"\1_{\2}", s)
    s = re.sub(r"(\d),(\d)", r"\1{,}\2", s)
    # beskrivende indekser (E_k, m_p, v_t, m_A) står rett; koordinater, tellere og tall er kursiv
    s = re.sub(r"_\{([A-Za-hk-mo-wæøå])\}", r"_{\\mathrm{\1}}", s)
    s = re.sub(r"_\{([A-Za-z]),([0-9])\}", r"_{\1,\2}", s)
    # isotoper: ²³⁵U
    s = re.sub(r"^\^\{(\d+)\}([A-Z][a-z]?)$", r"{}^{\1}\\mathrm{\2}", s)
    s = re.sub(r"\\(cdot|times|approx|leq|geq|ll|propto|to|sim) +(?=[\s})])", r"\\\1", s)
    return s

def tekst_esc(s):
    s = s.replace("\\", "\x00bs")
    for a, b in [("&", "\\&"), ("%", "\\%"), ("$", "\\$"), ("#", "\\#"), ("_", "\\_"), ("{", "\\{"),
                 ("}", "\\}"), ("~", "\\textasciitilde{}"), ("^", "\\^{}")]:
        s = s.replace(a, b)
    s = s.replace("\x00bs", "\\textbackslash{}")
    s = re.sub(r"\x01(.*?)\x02", r"\\textsubscript{\1}", s)
    s = re.sub(r"\x03(.*?)\x04", r"\\textsuperscript{\1}", s)
    return s

def matte_i_tekst(t):
    """Deler en tekst i ord, finner formler og returnerer LaTeX."""
    ord_ = t.split(" ")
    ut, i = [], 0
    while i < len(ord_):
        r = ord_[i]
        # Skill ut tegnsetting foran og bak
        foran = re.match(r"^[«(\[]*", r).group(0)
        kjerne0 = r[len(foran):]
        bak = re.search(r"[%s)\]]*$" % re.escape(TEGN_SLUTT), kjerne0).group(0) if kjerne0 else ""
        k = kjerne0[:len(kjerne0) - len(bak)] if bak else kjerne0
        kl = klasse(k)
        if kl in ("sterk", "tall", "var") and not re.fullmatch(r"[a-h]\)", r):
            # Bygg en kjede: operand (op operand)*, så lenge ordene ikke slutter med tegnsetting
            kjede, j = [r], i
            while not re.search(r"[%s]$" % re.escape(TEGN_SLUTT), ord_[j]) and j + 1 < len(ord_):
                op, neste = ord_[j + 1], (ord_[j + 2] if j + 2 < len(ord_) else "")
                nk = re.sub(r"[%s)\]]+$" % re.escape(TEGN_SLUTT), "", neste).lstrip("(")
                if op in OPS and neste and klasse(nk) in ("sterk", "tall", "var"):
                    kjede += [op, neste]; j += 2
                elif op not in OPS and (op.lstrip("(") in FUNKSJONER and klasse(nk) in ("sterk", "var")
                        or klasse(op.strip("()" + TEGN_SLUTT)) == "sterk" and op.strip("()" + TEGN_SLUTT) not in ENHETER and klasse(ord_[j].strip("()" + TEGN_SLUTT)) in ("sterk", "var")):
                    kjede += [op]; j += 1
                else:
                    break
            antall_op = sum(1 for x in kjede if x in OPS)
            er_formel = antall_op > 0 or kl == "sterk" or any(klasse(x.strip("()" + TEGN_SLUTT)) == "sterk" for x in kjede) or (kl == "var" and len(k) == 1 and k not in ("i",) and not foran.startswith("«"))
            if len(kjede) == 1 and k in ETIKETTER: er_formel = False
            if len(kjede) == 1 and k == "I" and (i == 0 or re.search(r"[.?!:]$", ord_[i - 1])): er_formel = False
            if er_formel:
                s = " ".join(kjede)
                # tegnsetting som skal stå utenfor formelen
                f = re.match(r"^[«]*", s).group(0); s = s[len(f):]
                b = re.search(r"[%s]*$" % re.escape(TEGN_SLUTT), s).group(0); s = s[:len(s) - len(b)] if b else s
                while s.startswith("(") and s.count("(") > s.count(")"): f += "("; s = s[1:]
                while s.endswith(")") and s.count(")") > s.count("("): b = ")" + b; s = s[:-1]
                while s.startswith("[") and s.count("[") > s.count("]"): f += "["; s = s[1:]
                while s.endswith("]") and s.count("]") > s.count("["): b = "]" + b; s = s[:-1]
                enh = ""
                if not b and re.search(r"[\d⁰¹²³⁴⁵⁶⁷⁸⁹)]$", s):
                    for n in (3, 2, 1):
                        kand = " ".join(ord_[j + 1:j + 1 + n])
                        kb = re.search(r"[%s)]*$" % re.escape(TEGN_SLUTT), kand).group(0)
                        kr = kand[:len(kand) - len(kb)] if kb else kand
                        if j + n < len(ord_) and (kr in ENHETER or kr in TO_ORD_ENHETER) and (n == 1 or kr in TO_ORD_ENHETER):
                            enh = "\\," + enhet_tex(kr); b = kb; j += n; break
                ut.append(tekst_esc(f) + "$" + formel_tex(s) + enh + "$" + tekst_esc(b))
                i = j + 1
                continue
        if kl == "tall" and not bak and i + 1 < len(ord_):
            nb = re.search(r"[%s)]*$" % re.escape(TEGN_SLUTT), ord_[i + 1]).group(0)
            nk = ord_[i + 1][:len(ord_[i + 1]) - len(nb)] if nb else ord_[i + 1]
            if nk in ENHETER:
                ut.append(tekst_esc(foran + k) + "~" + tekst_esc(ord_[i + 1]).replace("µ", "µ")); i += 2; continue
        ut.append(tekst_esc(r))
        i += 1
    return " ".join(ut)

# ---------- HTML til LaTeX ----------
def inline(node):
    """Inline-innhold til LaTeX. Elementer som em, strong, code og a blir plassholdere."""
    lager, deler = [], []
    def gå(n):
        for b in n.barn:
            if isinstance(b, str):
                deler.append(b); continue
            if b.tag == "sub": deler.append("\x01" + b.tekst() + "\x02")
            elif b.tag == "sup": deler.append("\x03" + b.tekst() + "\x04")
            elif b.tag == "br": lager.append("\\newline "); deler.append("\x10%d\x11" % (len(lager) - 1))
            elif b.tag == "code":
                lager.append("\\texttt{%s}" % tekst_esc(b.tekst()))
                deler.append("\x10%d\x11" % (len(lager) - 1))
            elif b.tag in ("em", "strong", "b", "i"):
                cmd = "\\emph" if b.tag in ("em", "i") else "\\textbf"
                lager.append(cmd + "{" + inline(b) + "}"); deler.append("\x10%d\x11" % (len(lager) - 1))
            elif b.tag == "a" and SIDE[0] and not b.attrs.get("href", "").startswith(("http", "#", "mailto")):
                adr = NETT + os.path.normpath(os.path.join(SIDE[0], b.attrs["href"]))
                lager.append(inline(b) + "\\footnote{\\url{%s}}" % adr.replace("https://", ""))
                deler.append("\x10%d\x11" % (len(lager) - 1))
            else:
                gå(b)
    gå(node)
    t = re.sub(r"\s+", " ", "".join(deler)).strip()
    t = matte_i_tekst(t)
    return re.sub("\x10(\\d+)\x11", lambda m: lager[int(m.group(1))], t)

def tabell(n):
    rader = list(n.finn(lambda x: x.tag == "tr"))
    if not rader: return ""
    kol = max(len([c for c in r.barn if isinstance(c, Node) and c.tag in ("td", "th")]) for r in rader)
    ut = ["\\begin{center}\\small", "\\begin{tabularx}{\\linewidth}{%s}" % ("Y" * kol), "\\toprule"]
    for r in rader:
        celler = [c for c in r.barn if isinstance(c, Node) and c.tag in ("td", "th")]
        tek = [("\\textbf{%s}" % inline(c)) if c.tag == "th" and r.parent.tag == "thead" else inline(c) for c in celler]
        tek += [""] * (kol - len(tek))
        ut.append(" & ".join(tek) + " \\\\")
        if r.parent.tag == "thead": ut.append("\\midrule")
    ut += ["\\bottomrule", "\\end{tabularx}", "\\end{center}"]
    return "\n".join(ut) + "\n"

def blokker(n):
    ut = []
    for b in n.barn:
        if isinstance(b, str):
            if b.strip(): ut.append(matte_i_tekst(re.sub(r"\s+", " ", b).strip()) + "\n")
            continue
        if b.tag in ("figure", "canvas", "script", "details", "pre", "button", "form", "textarea"): continue
        if b.tag == "h2": ut.append("\\section*{%s}\n" % inline(b))
        elif b.tag in ("h3", "h4"): ut.append("\\subsection*{%s}\n" % inline(b))
        elif b.tag == "p":
            if "knapp" in "".join(x.attrs.get("class", "") for x in b.finn(lambda x: x.tag == "a")): continue
            ut.append(inline(b) + "\n")
        elif b.tag in ("ul", "ol"):
            env = "itemize" if b.tag == "ul" else "enumerate"
            ut.append("\\begin{%s}" % env)
            for li in b.barn:
                if isinstance(li, Node) and li.tag == "li":
                    harblokk = any(isinstance(x, Node) and x.tag in ("p", "ul", "ol", "div", "table") for x in li.barn)
                    ut.append("\\item " + (blokker(li).strip() if harblokk else inline(li)))
            ut.append("\\end{%s}\n" % env)
        elif b.tag == "table": ut.append(tabell(b))
        else: ut.append(blokker(b))
    return "\n".join(x for x in ut if x)

def oppgaver(sek):
    ut = []
    for b in sek.barn:
        if not isinstance(b, Node) or b.tag == "details": continue
        if b.tag == "h2": ut.append("\\section*{%s}\n" % inline(b))
        elif b.tag == "ol" and "oppgaveliste" in b.klasser():
            ut.append("\\begin{oppgaveliste}")
            for li in b.barn:
                if not (isinstance(li, Node) and li.tag == "li"): continue
                fase = next(li.finn(lambda x: "fase" in x.klasser()), None)
                tekst = next((x for x in li.barn if isinstance(x, Node) and x.tag == "div"), li)
                f = ""
                if fase is not None:
                    navn = [k for k in fase.klasser() if k != "fase"][0]
                    navn = {"tipp": "gjett"}.get(navn, navn)
                    f = "\\fase{%s}{%s}" % (navn, inline(fase))
                ut.append("\\oppgave " + f + blokker(tekst).strip() + "\n\\svar")
            ut.append("\\end{oppgaveliste}\n")
        else:
            ut.append(blokker(_inn(b)))
    return "\n".join(ut)

def _inn(b):
    w = Node("x"); w.barn = [b]; return w

def lag_tex(mappe, navn):
    nøkkel = f"{mappe}/{navn}"
    rot = les_tre(os.path.join(ROT, mappe, navn + ".html"))
    ETIKETTER.clear(); SIDE[0] = mappe
    if re.search(r"\b(vogn|kule|klokke|bane|del) [AB]\b", rot.tekst(), re.I): ETIKETTER.update("ABCD")
    main = next(rot.finn(lambda x: x.tag == "main"))
    h1 = next(main.finn(lambda x: x.tag == "h1"))
    smul = next(main.finn(lambda x: "brodsmuler" in x.klasser()), None)
    deler = [d.strip() for d in smul.tekst().split("/")] if smul else []
    fagtema = " · ".join(deler) if deler and deler[0].startswith("Fysikk") else (deler[1] if len(deler) > 1 else "")
    sek = next(main.finn(lambda x: x.tag == "section" and "oppgaver" in x.klasser()), None)
    if sek is None: return None
    tittel = KUN_OPPGAVER.get(nøkkel) or inline(h1)
    adr = NETT + nøkkel + ".html"
    qrtekst = {"sim": "Simuleringen", "opplegg": "Opplegget på nett", "programmering": "Koden på nett"}[mappe]
    if nøkkel in QR: adr, qrtekst = NETT + QR[nøkkel][0] + ".html", QR[nøkkel][1]
    kropp = []
    if nøkkel not in KUN_OPPGAVER:
        ingr = next(main.finn(lambda x: "ingress" in x.klasser()), None)
        if ingr is not None: kropp.append(inline(ingr) + "\n")
        if mappe == "opplegg":
            # tekstblokkene før oppgavene (hensikt, utstyr, framgangsmåte ...), ikke verktøyene
            søsken = sek.parent.barn
            kropp += [blokker(d) for d in søsken[:søsken.index(sek)]
                      if isinstance(d, Node) and d.tag == "div" and "opplegg" in d.klasser()]
    kropp.append(oppgaver(sek))
    hode = ["% Laget automatisk av elevark/lag_elevark.py fra " + nøkkel + ".html. Endringer her blir overskrevet.",
            "\\documentclass[11pt]{article}", "\\usepackage{elevark}"]
    if mappe in SVARHOYDE: hode.append("\\setlength{\\svarhoyde}{%s}" % SVARHOYDE[mappe])
    tex = "\n".join(hode) + "\n\\begin{document}\n" + \
        "\\elevarkhode{%s}{%s}{%s}{%s}\n\n" % (tekst_esc(fagtema), tittel, adr, qrtekst) + \
        "\n".join(kropp) + "\n\\end{document}\n"
    tex = re.sub(r"\n{3,}", "\n\n", tex)
    for a, b in RETTELSER.get(nøkkel, []) + RETTELSER.get("*", []):
        if a not in tex and nøkkel in RETTELSER and (a, b) in RETTELSER[nøkkel]: print("  ADVARSEL: fant ikke rettelse i", nøkkel, ":", a[:60])
        tex = tex.replace(a, b)
    return tex

# ---------- Kompilering og lenker ----------
def kompiler(texfil, pdfmål):
    with tempfile.TemporaryDirectory() as tmp:
        env = dict(os.environ, TEXINPUTS=os.path.join(ARK, "tex") + "//:")
        r = subprocess.run(["lualatex", "-interaction=nonstopmode", "-halt-on-error", "-output-directory", tmp, texfil],
                           env=env, capture_output=True, text=True)
        pdf = os.path.join(tmp, os.path.basename(texfil)[:-4] + ".pdf")
        if r.returncode or not os.path.exists(pdf):
            feil = [l for l in r.stdout.splitlines() if l.startswith("!") or "Error" in l]
            print("  FEIL:", texfil, "\n   ", "\n    ".join(feil[:5])); return False
        os.makedirs(os.path.dirname(pdfmål), exist_ok=True); shutil.copy(pdf, pdfmål)
        return True

KNAPP = '<p class="elevark-lenke"><a class="knapp lys" href="../elevark/{m}/{n}.pdf" download>Last ned elevark (PDF)</a></p>'

def legg_inn_lenke(mappe, navn):
    sti = os.path.join(ROT, mappe, navn + ".html")
    s = open(sti, encoding="utf-8").read()
    if "elevark-lenke" in s: return
    m = re.search(r'(<section class="oppgaver"[^>]*>\s*<h2[^>]*>.*?</h2>)(\s*)', s, re.S)
    if not m: return
    innrykk = m.group(2) if m.group(2).strip() == "" and "\n" in m.group(2) else "\n"
    s = s[:m.end(1)] + innrykk + KNAPP.format(m=mappe, n=navn) + s[m.end(1):]
    open(sti, "w", encoding="utf-8").write(s)

RETTELSER = {
    "opplegg/ballistisk-pendel": [("$I$ støtet", "I støtet"), ("$mv = (m$ + M)V", "$mv = (m + M)V$"), ("= (m$ + M)g · $L(1 - \\cos  θ)$", "= (m + M)g \\cdot L(1 - \\cos θ)$")],
    "opplegg/eggslipp": [("poeng = 10 · høyde i cm / masse i gram",
        "$\\displaystyle \\text{poeng} = 10 \\cdot \\frac{\\text{høyde i cm}}{\\text{masse i gram}}$")],
    "*": [("verktøyet under", "verktøyet på nettsiden"), ("\\section*{Oppgaver til elevene}", "\\section*{Oppgaver}")],
    "opplegg/repetisjon-felt": [("blandede oppgaver med løsningsforslag.", "blandede oppgaver."),
        ("Hver oppgave har en lenke til en simulering der du kan sjekke svaret.", "Simuleringene i fotnotene kan du bruke til å sjekke svarene.")],
    "opplegg/kraftsensorer": [("Skriv inn i tabellen under.", r"""Skriv inn i tabellen.
\begin{center}\begin{tabular}{l*{5}{p{1.6cm}}}\toprule
$m$ (g) & 100 & 200 & 300 & 400 & 500 \\ \midrule
$F$ (N) & & & & & \\[4pt] \bottomrule
\end{tabular}\end{center}
""")],
    "opplegg/reaksjonstid": [("$t$ = (middelverdi ± usikkerhet) ms", "$t = (\\text{middelverdi} \\pm \\text{usikkerhet})\\,\\mathrm{ms}$")],
    "sim/maaleusikkerhet": [("$T$ = (middelverdi ± usikkerhet) $s$", "$T = (\\text{middelverdi} \\pm \\text{usikkerhet})\\,\\mathrm{s}$")],
    "sim/avboyning": [("$y = U_{\\mathrm{d}} l^{2} / (4$ $d U_{\\mathrm{a}}$)", "$y = U_{\\mathrm{d}} l^{2} / (4 d U_{\\mathrm{a}})$")],
    "programmering/python-regresjon": [("(1 $AU = 1{,}496 \\cdot 10^{11}\\,\\mathrm{m}$, 1~år = $3{,}156 \\cdot 10^{7}\\,\\mathrm{s}$)",
        "($1\\,\\mathrm{AU} = 1{,}496 \\cdot 10^{11}\\,\\mathrm{m}$, $1\\text{ år} = 3{,}156 \\cdot 10^{7}\\,\\mathrm{s}$)")],
    "sim/samtidighet": [("$P$", "P"), ("$T$", "T")],
    "sim/sprettball": [("$e$ = √andel", "$e = \\sqrt{\\text{andel}}$")],
    "sim/millikan": [("±1 $V$", "±1 V")],
    "sim/e-over-m": [("$e/m$ = 2U / $(B^{2}r^{2})$", "$e/m = 2U/(B^{2}r^{2})$")],
}

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    bare_tex = "--bare-tex" in sys.argv
    sider = []
    for mappe in MAPPER:
        for f in sorted(glob.glob(os.path.join(ROT, mappe, "*.html"))):
            n = os.path.basename(f)[:-5]
            if f"{mappe}/{n}" in HOPP_OVER: continue
            if args and f"{mappe}/{n}" not in args: continue
            sider.append((mappe, n))
    ok = 0
    for mappe, n in sider:
        tex = lag_tex(mappe, n)
        if tex is None: continue
        texfil = os.path.join(ARK, "tex", mappe, n + ".tex")
        os.makedirs(os.path.dirname(texfil), exist_ok=True)
        open(texfil, "w", encoding="utf-8").write(tex)
        if bare_tex: continue
        if kompiler(texfil, os.path.join(ARK, mappe, n + ".pdf")):
            legg_inn_lenke(mappe, n); ok += 1
    print(f"{ok} av {len(sider)} PDF-er laget" if not bare_tex else f"{len(sider)} .tex-filer skrevet")

if __name__ == "__main__":
    main()
