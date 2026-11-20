# Setter inn kort for de nye sidene på oversiktssidene.
import re
KODE = '<rect class="strek-dempet" x="10" y="10" width="100" height="52" rx="4" style="fill:none"/><path class="strek-f1" d="M20 28L28 34L20 40" style="stroke-width:2.5"/>'
REP = '<rect class="strek-dempet" x="14" y="10" width="92" height="52" rx="4" style="fill:none"/><path class="strek-f1" d="M24 24H56M24 36H56M24 48H56"/><path class="strek-f2" d="M64 24H96M64 36H96M64 48H96"/>'
BT = '<rect class="strek-dempet" x="14" y="8" width="92" height="56" rx="4" style="fill:none"/><circle class="strek-dempet" cx="30" cy="24" r="5" style="fill:none"/><circle class="fyll-f2" cx="30" cy="40" r="5"/><circle class="strek-dempet" cx="30" cy="56" r="5" style="fill:none"/><path class="strek-blekk" d="M42 24H92M42 40H84M42 56H88" style="stroke-width:2"/>'
K = {
 "opplegg/heis-mobil.html": ("Heisen med mobilen", "Mål akselerasjonen i en heis med phyphox, regn ut fart og høyde, og finn ut hva en badevekt ville vist.",
   '<rect class="strek-blekk" x="40" y="6" width="40" height="60" style="fill:none;stroke-width:2"/><rect class="fyll-f2" x="52" y="40" width="16" height="22" rx="2"/><path class="strek-f1" d="M96 52V18M90 24L96 18L102 24" style="stroke-width:2"/>'),
 "opplegg/sentripetal-mobil.html": ("Sentripetalakselerasjon med mobilen", "Mobilen i en salatslynge: Mål a og ω med phyphox, plott a mot ω², og finn hvor sensoren sitter.",
   '<circle class="strek-dempet" cx="60" cy="36" r="28" style="fill:none;stroke-width:2"/><rect class="fyll-f2" x="74" y="26" width="10" height="20" rx="2"/><path class="strek-f1" d="M74 36H62M68 31L62 36L68 41" style="stroke-width:2"/><circle class="fyll-blekk" cx="60" cy="36" r="3"/>'),
 "opplegg/video-skratt-kast.html": ("Videoanalyse av skrått kast", "Film et kast, analyser x og y hver for seg i Tracker, og finn startfarten, kastvinkelen og g.",
   '<rect class="strek-dempet" x="8" y="6" width="104" height="60" rx="3" style="fill:none"/><circle class="fyll-f2" cx="22" cy="50" r="3"/><circle class="fyll-f2" cx="38" cy="30" r="3"/><circle class="fyll-f2" cx="56" cy="20" r="3"/><circle class="fyll-f2" cx="74" cy="22" r="3"/><circle class="fyll-f1" cx="92" cy="36" r="4"/>'),
 "opplegg/e-over-m.html": ("Forsøk: e/m for elektronet", "Bestem e/m med et fintrådrør og Helmholtz-spoler. Verktøy som regner ut B og e/m og tilpasser en linje.",
   '<circle class="strek-dempet" cx="60" cy="36" r="30" style="fill:none;stroke-width:4;opacity:.5"/><circle class="strek-blekk" cx="60" cy="36" r="22" style="fill:none;stroke-width:1.5"/><circle class="strek-f1" cx="60" cy="40" r="13" style="fill:none;stroke-width:2.5"/>'),
 "sim/e-over-m.html": ("e/m for elektronet", "Elektroner går i sirkel i feltet fra Helmholtz-spoler. Les av diameteren og bestem e/m.",
   '<circle class="strek-dempet" cx="60" cy="36" r="30" style="fill:none;stroke-width:4;opacity:.5"/><circle class="strek-blekk" cx="60" cy="36" r="22" style="fill:none;stroke-width:1.5"/><circle class="strek-f1" cx="60" cy="40" r="13" style="fill:none;stroke-width:2.5"/>'),
 "sim/millikan.html": ("Millikans oljedråpeforsøk", "Få ladde oljedråper til å sveve mellom to plater, og oppdag at ladning kommer i hele multipler av e.",
   '<path class="strek-f1" d="M14 12H106" style="stroke-width:4"/><path class="strek-f2" d="M14 60H106" style="stroke-width:4"/><circle class="fyll-f1" cx="48" cy="34" r="4"/><circle class="fyll-dempet" cx="74" cy="42" r="3"/><circle class="fyll-dempet" cx="86" cy="26" r="2.5"/>'),
 "programmering/python-energi-friksjon.html": ("Energi med friksjon og luftmotstand", "Simuler en kloss på et skråplan og en skiløper i en lang bakke, og før regnskap over energien.",
   KODE + '<path class="strek-f2" d="M40 24L100 54" style="stroke-width:2"/><path class="strek-blekk" d="M40 50H100" style="stroke-width:1;stroke-dasharray:4 3"/>'),
 "programmering/python-rakett.html": ("Rakett med bevegelsesmengde", "En rakett som skyter ut gass steg for steg, og en modellrakett med skyvekraft, tyngde og luftmotstand.",
   KODE + '<path class="strek-f2" d="M70 14L78 26V48H62V26Z" style="fill:none;stroke-width:2"/><path class="strek-f1" d="M66 52L70 62L74 52" style="stroke-width:2"/>'),
 "programmering/python-monte-carlo.html": ("Usikkerhet med Monte Carlo-simulering", "Simuler 100 000 målinger, finn usikkerheten, og se når regnereglene for usikkerhet ikke holder.",
   KODE + '<path class="fyll-f2" d="M40 54h6v-6h-6zM48 54h6v-16h-6zM56 54h6v-28h-6zM64 54h6v-32h-6zM72 54h6v-20h-6zM80 54h6v-10h-6zM88 54h6v-4h-6z"/>'),
 "programmering/python-biot-savart.html": ("Magnetfeltet fra en spole med Biot–Savarts lov", "Del en strømsløyfe og en spole i tusenvis av biter, og sammenlign med formlene for sløyfe og lang spole.",
   KODE + '<path class="strek-f2" d="M44 22v28M54 22v28M64 22v28M74 22v28M84 22v28M94 22v28" style="stroke-width:2"/><path class="strek-blekk" d="M38 36H102" style="stroke-width:1.5;stroke-dasharray:4 3"/>'),
 "opplegg/kompetansemaal.html": ("Ressurser etter kompetansemål", "Alt på fysikklab.no sortert etter kompetansemålene i Fysikk 1 og 2, og hvilke mål som mangler ressurser.",
   '<rect class="strek-dempet" x="14" y="8" width="92" height="56" rx="4" style="fill:none"/><path class="strek-f2" d="M24 22L28 26L36 18M24 38L28 42L36 34" style="stroke-width:2"/><path class="strek-blekk" d="M44 22H94M44 38H86M44 54H90" style="stroke-width:2"/><circle class="strek-dempet" cx="30" cy="54" r="4" style="fill:none"/>'),
}
REPTEKST = {"bevegelse": ("rettlinjet bevegelse", "Grafer, bevegelseslikningene og blandede oppgaver med løsningsforslag."),
 "krefter": ("krefter", "Newtons lover, kraftsum på skråplan og blandede oppgaver med løsningsforslag."),
 "energi": ("arbeid og energi", "Energibevaring, friksjonsarbeid, effekt og blandede oppgaver med løsningsforslag."),
 "bevegelsesmengde": ("bevegelsesmengde og støt", "Impuls, bevaring og støt, med blandede oppgaver og løsningsforslag."),
 "mekanikk-2": ("kast og sirkelbevegelse", "Kast, krefter i to dimensjoner og sirkelbevegelse, med blandede oppgaver og løsningsforslag."),
 "relativitet": ("spesiell relativitetsteori", "Tid, lengde, samtidighet og energi, med blandede oppgaver og løsningsforslag.")}
for n, (t, b) in REPTEKST.items():
    K[f"opplegg/repetisjon-{n}.html"] = (f"Repetisjon: {t}", b, REP)
BTTEKST = {"krefter": "krefter og bevegelse", "energi": "arbeid og energi", "bevegelsesmengde": "bevegelsesmengde og støt", "kast-sirkel": "kast og sirkelbevegelse", "relativitet": "spesiell relativitetsteori", "felt": "elektriske og magnetiske felt"}
for n, t in BTTEKST.items():
    K[f"opplegg/begrep-{n}.html"] = (f"Begrepstest: {t}", "Åtte flervalgsspørsmål om typiske misoppfatninger, med tilbakemelding med en gang.", BT)

def kort(href):
    t, b, svg = K[href]
    return f'            <li><a class="sim-kort" href="{href}"><svg class="sim-ikon" viewBox="0 0 120 72" aria-hidden="true">{svg}</svg><span class="sim-kort-tekst"><span class="sim-kort-tittel">{t}</span><span>{b}</span></span></a></li>'

def blokk_sett(s, overskrift, nye):
    """Legg kortene i blokken med overskriften. Simuleringer etter siste sim-kort, resten sist."""
    i = s.index(f"<h2>{overskrift}</h2>")
    slutt = s.index("          </ul>", i)
    del_ = s[i:slutt]
    for h in nye:
        if f'href="{h}"' in del_: continue
        if h.startswith("sim/") and 'href="sim/' in del_:
            j = i + del_.rindex('href="sim/'); j = s.index("</li>\n", j) + 6
        else:
            j = slutt
        s = s[:j] + kort(h) + "\n" + s[j:]
        slutt = s.index("          </ul>", i); del_ = s[i:slutt]
    return s

def ny_blokk(s, foer, overskrift, nye):
    if f"<h2>{overskrift}</h2>" in s: return blokk_sett(s, overskrift, nye)
    i = s.index(f"<h2>{foer}</h2>"); i = s.rindex('        <div class="tema-blokk">', 0, i)
    b = f'        <div class="tema-blokk">\n          <h2>{overskrift}</h2>\n          <ul class="sim-kort-liste">\n' + "\n".join(kort(h) for h in nye) + "\n          </ul>\n        </div>\n\n"
    return s[:i] + b + s[i:]

def fil(navn, f):
    s = open(navn, encoding="utf-8").read(); s = f(s); open(navn, "w", encoding="utf-8").write(s)

def uo(s):
    s = blokk_sett(s, "Fysikk 1 · Rettlinjet bevegelse", ["opplegg/repetisjon-bevegelse.html"])
    s = blokk_sett(s, "Fysikk 1 · Krefter", ["opplegg/heis-mobil.html", "opplegg/repetisjon-krefter.html", "opplegg/begrep-krefter.html"])
    s = ny_blokk(s, "Fysikk 1 · Bevegelsesmengde og støt", "Fysikk 1 · Mekanisk energi", ["opplegg/repetisjon-energi.html", "opplegg/begrep-energi.html"])
    s = blokk_sett(s, "Fysikk 1 · Bevegelsesmengde og støt", ["opplegg/repetisjon-bevegelsesmengde.html", "opplegg/begrep-bevegelsesmengde.html"])
    s = blokk_sett(s, "Fysikk 2 · Bevegelse og krefter i to dimensjoner", ["opplegg/video-skratt-kast.html"])
    s = blokk_sett(s, "Fysikk 2 · Sirkelbevegelse", ["opplegg/sentripetal-mobil.html", "opplegg/repetisjon-mekanikk-2.html", "opplegg/begrep-kast-sirkel.html"])
    s = blokk_sett(s, "Fysikk 2 · Spesiell relativitetsteori", ["opplegg/repetisjon-relativitet.html", "opplegg/begrep-relativitet.html"])
    s = blokk_sett(s, "Fysikk 2 · Magnetiske felt og krefter", ["opplegg/e-over-m.html"])
    s = blokk_sett(s, "Fysikk 2 · Elektriske felt og krefter", ["opplegg/begrep-felt.html"])
    if "<h2>Til læreren</h2>" not in s:
        i = s.rindex("      </div>\n    </section>\n  </main>")
        s = s[:i] + '\n        <div class="tema-blokk">\n          <h2>Til læreren</h2>\n          <ul class="sim-kort-liste">\n' + kort("opplegg/kompetansemaal.html") + "\n          </ul>\n        </div>\n" + s[i:]
    s = s.replace("Hvert opplegg har oppgaver og løsningsforslag.</p>", 'Hvert opplegg har oppgaver og løsningsforslag. Her er også repetisjonssider og begrepstester med tilbakemelding med en gang. <a href="opplegg/kompetansemaal.html">Ressurser etter kompetansemål</a> viser alt på siden sortert etter læreplanen.</p>')
    return s
fil("undervisningsopplegg.html", uo)

def sim(s):
    # Simuleringssiden har bare simuleringer som kort. Forsøk, repetisjon og programmering står som lenker
    # i «Mer til temaet» under hvert tema, og legges inn for hånd.
    s = blokk_sett(s, "Fysikk 2 · Elektriske felt og krefter", ["sim/millikan.html"])
    s = blokk_sett(s, "Fysikk 2 · Magnetiske felt og krefter", ["sim/e-over-m.html"])
    return s
fil("simuleringer.html", sim)
def pr(s):
    s = blokk_sett(s, "Fysikk 1 · Mekanisk energi", ["programmering/python-energi-friksjon.html"])
    s = blokk_sett(s, "Fysikk 1 · Bevegelsesmengde og støt", ["programmering/python-rakett.html"])
    s = blokk_sett(s, "Fysikk 2 · Tenke og gjøre fysikk", ["programmering/python-monte-carlo.html"])
    s = blokk_sett(s, "Fysikk 2 · Magnetiske felt og krefter", ["programmering/python-biot-savart.html"])
    return s
fil("programmering.html", pr)
print("simuleringer.html", len(set(re.findall(r'class="sim-kort" href="(sim/[^"]+)"', open("simuleringer.html", encoding="utf-8").read()))), "simuleringer")
