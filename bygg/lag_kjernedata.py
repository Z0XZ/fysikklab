#!/usr/bin/env python3
# Bruk: python3 bygg/lag_kjernedata.py <mappe med nist_all.txt og iaea.csv> bygg/kjernedata.py
# nist_all.txt: lagret fra https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=&ascii=ascii2&isotype=all
# iaea.csv: https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all
# Lager lektorbo.no/bygg/kjernedata.py fra NIST (atommasser, forekomst, atomvekt) og IAEA LiveChart (halveringstid, henfall).
import csv, json, re, sys
D, UT = sys.argv[1], sys.argv[2]
import html as _html
_t = _html.unescape(re.sub(r"<[^>]+>", "", open(D + "/nist_all.txt", encoding="latin-1").read()))
nist = re.findall(r"Atomic Number = (\d+)\s+Atomic Symbol = (\S+)\s+Mass Number = (\d+)\s+Relative Atomic Mass = (\S+)\s+Isotopic Composition = ([^\n]*)\s+Standard Atomic Weight = ([^\n]*)", _t)
iaea = list(csv.DictReader(open(D + "/iaea.csv")))
NAVN = "hydrogen helium litium beryllium bor karbon nitrogen oksygen fluor neon natrium magnesium aluminium silisium fosfor svovel klor argon kalium kalsium scandium titan vanadium krom mangan jern kobolt nikkel kobber sink gallium germanium arsen selen brom krypton rubidium strontium yttrium zirkonium niob molybden technetium ruthenium rhodium palladium sølv kadmium indium tinn antimon tellur jod xenon cesium barium lantan cerium praseodym neodym prometium samarium europium gadolinium terbium dysprosium holmium erbium thulium ytterbium lutetium hafnium tantal wolfram rhenium osmium iridium platina gull kvikksølv thallium bly vismut polonium astat radon francium radium actinium thorium protactinium uran neptunium plutonium americium curium berkelium californium einsteinium fermium mendelevium nobelium lawrencium rutherfordium dubnium seaborgium bohrium hassium meitnerium darmstadtium røntgenium kopernikium nihonium flerovium moscovium livermorium tennes oganesson".split()
assert len(NAVN) == 118
# IUPAC sine konvensjonelle verdier for grunnstoffene der NIST oppgir et intervall
KONV = {1: "1,008", 3: "6,94", 5: "10,81", 6: "12,011", 7: "14,007", 8: "15,999", 12: "24,305", 14: "28,085", 16: "32,06", 17: "35,45", 35: "79,904", 81: "204,38"}
SYM = {}
vekt = {}
for z, s, a, m, ab, sw in nist:
    z = int(z)
    if z not in SYM and s not in ("D", "T"): SYM[z] = s
    vekt.setdefault(z, sw)
def tall(x): return x.replace(".", ",")
def prosent(x):
    if not x: return ""
    v = float(x) * 100
    return (f"{v:.4g}" if v >= 0.001 else f"{v:.2g}").replace(".", ",")
def ren(v): return re.sub(r"\(.*?\)", "", v)
ENH = {"Y": 365.25 * 86400, "d": 86400, "h": 3600, "m": 60, "s": 1}
def halv(rad):
    if rad["half_life"] == "STABLE": return None
    sek = float(rad["half_life_sec"]) if rad["half_life_sec"] else None
    if sek is None: return None
    for enhet, f, navn in [("år", 365.25 * 86400, "år"), ("døgn", 86400, "døgn"), ("h", 3600, "h"), ("min", 60, "min"), ("s", 1, "s")]:
        if sek >= f * (1 if enhet != "år" else 1): v = sek / f; break
    else: v, navn = sek * 1000, "ms"
    if v >= 1e5: e = int(f"{v:e}".split("e")[1]); txt = f"{v / 10**e:.3g} · 10^{{{e}}}".replace(".", ",")
    else:
        import math
        v = round(v, 3 - int(math.floor(math.log10(v))))
        txt = (f"{v:,.0f}".replace(",", "\u202f") if v >= 1000 else f"{v:g}").replace(".", ",")
    return txt + " " + navn
HENF = {"A": "α", "B-": "β⁻", "B+": "β⁺", "EC": "EC", "EC+B+": "β⁺/EC", "IT": "IT", "SF": "fisjon", "N": "n", "P": "p", "2B-": "2β⁻"}
def henfall(rad):
    d = rad["decay_1"]
    if not d: return ""
    t = HENF.get(d, d)
    return t
rader = {(int(r["z"]), int(r["z"]) + int(r["n"])): r for r in iaea}
nistm = {(int(z), int(a)): (ren(m), ren(ab)) for z, s, a, m, ab, sw in nist}

grunnstoff = []
for z in range(1, 119):
    stabile = sorted([(a, r) for (zz, a), r in rader.items() if zz == z and r["half_life"] == "STABLE"])
    st = [(a, prosent(nistm.get((z, a), ("", ""))[1])) for a, r in stabile]
    lang = None
    if not stabile:
        kand = [(float(r["half_life_sec"]), a, r) for (zz, a), r in rader.items() if zz == z and r["half_life_sec"]]
        if kand:
            sek, a, r = max(kand); lang = (a, halv(r), henfall(r))
    # naturlige radioaktive isotoper med forekomst (for eksempel U-235, U-238, K-40, Th-232)
    nat = [(a, prosent(nistm[(z, a)][1]), halv(r), henfall(r)) for (zz, a), r in rader.items() if zz == z and r["half_life"] != "STABLE" and nistm.get((z, a), ("", ""))[1]]
    sw = vekt.get(z, "")
    if z in KONV: masse = KONV[z]
    elif sw.startswith("["): masse = "(" + sw.strip("[]") + ")"
    elif sw.strip(): masse = tall(ren(sw))
    else: masse = f"({lang[0]})" if lang else ""
    grunnstoff.append(dict(z=z, sym=SYM.get(z) or [r["symbol"] for (zz, a), r in rader.items() if zz == z][0], navn=NAVN[z - 1], masse=masse,
                           stabile=st, lengst=lang, naturlige=sorted(nat)))

UTVALG = """1 1;1 2;1 3;2 3;2 4;3 6;3 7;4 7;4 9;5 10;5 11;6 11;6 12;6 13;6 14;7 13;7 14;7 15;8 15;8 16;8 17;8 18;9 18;9 19;10 20;11 22;11 23;11 24;12 24;13 27;14 28;15 30;15 31;15 32;16 32;17 35;18 40;19 39;19 40;20 40;26 56;27 59;27 60;28 58;28 62;29 63;36 89;36 92;38 90;38 94;39 90;43 99;53 127;53 131;54 131;54 140;55 133;55 137;56 137;56 141;56 144;82 206;82 207;82 208;82 210;83 209;83 210;84 210;84 214;84 218;86 220;86 222;88 226;90 232;90 234;92 233;92 234;92 235;92 236;92 238;92 239;93 239;94 239;94 240;95 241"""
nuklider = [dict(z=0, a=1, sym="n", masse="1,008665", halv=halv(rader[(0, 1)]), henfall="β⁻", forekomst="")]
for par in UTVALG.split(";"):
    z, a = map(int, par.split())
    r = rader[(z, a)]; m, ab = nistm[(z, a)]
    m = f"{float(m):.6f}".replace(".", ",")
    nuklider.append(dict(z=z, a=a, sym=SYM[z] if z > 1 else "H", masse=m, halv=halv(r) or "stabil", henfall=henfall(r) if r["half_life"] != "STABLE" else "", forekomst=prosent(ab) + " %" if ab else ""))
ut = ["# Laget av et engangsskript fra NIST «Atomic Weights and Isotopic Compositions» (atommasser, forekomst og standard atomvekt)",
      "# og IAEA LiveChart of Nuclides (halveringstid og henfallsmåte), hentet 27.11.2026. Ikke rediger for hånd uten å sjekke mot kildene.",
      "# Atomvekt: IUPAC sin konvensjonelle verdi der NIST oppgir et intervall. Tall i parentes er massetallet til den mest stabile isotopen.",
      "GRUNNSTOFF = " + json.dumps(grunnstoff, ensure_ascii=False, indent=0),
      "NUKLIDER = " + json.dumps(nuklider, ensure_ascii=False, indent=0)]
s = "\n".join(ut).replace(": null", ": None").replace(": true", ": True").replace(": false", ": False")
open(UT, "w", encoding="utf-8").write(s + "\n")
print(len(grunnstoff), len(nuklider))
