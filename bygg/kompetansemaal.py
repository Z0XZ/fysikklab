# Lærersiden opplegg/kompetansemaal.html: ressursene sortert etter kompetansemålene i FYS01-02. Brukes av bygg.py.
# Ordlyden i målene er hentet ordrett fra Udirs PDF av læreplanen (data.udir.no, FYS01-02). Legg nye sider inn i listene F1 og F2.
import os, re, sys, html
def tittel(sti, ROT):
    s = open(os.path.join(ROT, sti), encoding="utf-8").read()
    return html.unescape(re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S).group(1)).strip()
TYPE = {"sim": "Simulering", "opplegg": "Opplegg", "programmering": "Programmering"}
def typ(sti):
    n = os.path.basename(sti)
    if n.startswith("begrep-"): return "Begrepstest"
    if n.startswith("repetisjon-"): return "Repetisjon"
    return TYPE[sti.split("/")[0]]
s = lambda *n: ["sim/" + x + ".html" for x in n]
o = lambda *n: ["opplegg/" + x + ".html" for x in n]
p = lambda *n: ["programmering/python-" + x + ".html" for x in n]

F1 = [
 ("planlegge og gjennomføre forsøk, analysere data og trekke konklusjoner",
  o("reaksjonstid", "video-fall", "video-rulling", "video-muffins", "friksjonsforsok", "kraftsensorer", "kraftsensor", "heis-mobil", "videoanalyse-stot", "eggslipp") + s("maaleusikkerhet", "videoanalyse")),
 ("vurdere, bruke og lage modeller til å beskrive og forutsi fysiske fenomener",
  s("luftmotstand", "fritt-fall") + o("video-muffins") + p("bevegelse-maledata", "variable-krefter")),
 ("vurdere ulike påstander og argumenter om energi og klima i samfunnsaktuelle problemsstillinger", []),
 ("utforske, analysere og beskrive rettlinjet bevegelse",
  s("bevegelsesgrafer", "fritt-fall", "bremselengde", "videoanalyse") + o("video-fall", "video-rulling", "repetisjon-bevegelse") + p("bevegelse-maledata")),
 ("forstå sammenhenger mellom krefter, bevegelse og energi, og bruke dem til å gjøre beregninger",
  s("heis", "friksjon", "luftmotstand", "vogn-og-lodd", "to-baner", "pendel-pinne", "berg-og-dal", "trappelop") + o("kraftsensorer", "friksjonsforsok", "heis-mobil", "repetisjon-krefter", "repetisjon-energi", "begrep-krefter", "begrep-energi")),
 ("bruke numeriske metoder og programmering til å modellere og utforske bevegelse i situasjoner der akselerasjonen ikke er konstant",
  p("grunnkurs", "variable-krefter", "energi-friksjon", "rakett", "bevegelse-maledata") + s("luftmotstand")),
 ("forstå og gjøre rede for konsekvenser av at bevegelsesmengde og energi er bevart, og bruke dette i beregninger",
  s("vognstot", "bakkestot", "impuls", "ballistisk-pendel", "kuler-i-snorer", "ballstabel", "rekyl") + o("kraftsensor", "eggslipp", "videoanalyse-stot", "repetisjon-bevegelsesmengde", "begrep-bevegelsesmengde") + p("vognstot", "rakett")),
 ("utforske hvordan energi kan gå fra en form til en annen, og vurdere energikvalitet og virkningsgrad i slike overganger",
  s("sprettball", "trappelop", "berg-og-dal") + o("repetisjon-energi") + p("energi-friksjon")),
 ("gjøre rede for sammenhengene mellom ladning, spenning og elektrisk energi og utforske effektomsetning i elektriske kretser", []),
 ("forstå begrepet temperatur og forklare hvordan tilført varme til et system fører til temperaturendring i dette systemet", []),
 ("utforske, sammenligne og beskrive stråling fra legemer med ulik temperatur og overflate", []),
 ("bruke modeller av strålingsbalansen til jorda til å gjøre beregninger, og vurdere hvordan endringer på jordoverflaten og i atmosfæren påvirker denne balansen", []),
 ("beskrive ulike atommodeller og drøfte hvordan observerbare effekter støtter eller utfordrer dem", []),
 ("forstå begrepet fusjon og vurdere hvordan ulike grunnstoff kan dannes når stjerner lever, kolliderer og dør", []),
]
F2 = [
 ("planlegge, gjennomføre og videreutvikle forsøk, og analysere data og beregne usikkerhet for å vurdere gyldigheten av funn",
  s("usikkerhet-beregning", "linearisering") + o("sentripetal-mobil", "video-skratt-kast", "magnetfelt-mobil", "e-over-m") + p("regresjon", "monte-carlo")),
 ("presentere sentrale elementer i ny viten i fysikk som er et resultat av internasjonalt forskningssamarbeid, og vurdere hvordan slikt samarbeid bidrar i kunnskapsutviklingen", []),
 ("bruke numeriske metoder og programmering til å utforske og modellere fysiske fenomener",
  p("horisontalt-kast", "bil-luftmotstand", "sirkelbevegelse", "satellittbane", "regresjon", "monte-carlo", "elektrisk-felt", "partikkelbane", "biot-savart", "ekte-data")),
 ("utforske, beskrive og modellere bevegelse i to dimensjoner",
  s("skratt-kast", "skraaplan", "lodd-i-snorer") + o("video-skratt-kast", "repetisjon-mekanikk-2", "begrep-kast-sirkel") + p("horisontalt-kast", "bil-luftmotstand")),
 ("gjøre rede for hvordan krefter kan forårsake krumlinjet bevegelse, og bruke dette i beregninger",
  s("sirkelbevegelse", "dosert-sving", "loddrett-sirkel") + o("sentripetal-mobil", "repetisjon-mekanikk-2", "begrep-kast-sirkel") + p("sirkelbevegelse")),
 ("beskrive elektriske og magnetiske felt og gjøre rede for krefter på objekter med masse og ladning i slike felt",
  s("elektrisk-felt", "ladd-kule", "avboyning", "elektrostatisk-pingpong", "millikan", "magnetfelt-bane", "fartsvelger", "syklotron", "e-over-m", "stromhuske", "magnetfelt-ledere") + o("magnetfelt-mobil", "e-over-m", "repetisjon-felt", "begrep-felt") + p("elektrisk-felt", "partikkelbane", "biot-savart")),
 ("gjøre rede for energibevaring i gravitasjonelle sentralfelt og bruke dette til å beregne bevegelse i slike felt",
  p("satellittbane")),
 ("utforske ulike måter å indusere elektromotorisk spenning og strøm, og analysere resultatene", []),
 ("forklare hvordan induksjon kan inngå i bærekraftig energiproduksjon og vurdere anvendelser av induksjon i dagliglivet", []),
 ("beskrive de sentrale prinsippene i den spesielle og generelle relativitetsteorien og gjøre rede for hvordan disse har endret vår forståelse av tid, rom og felt",
  s("lysklokke", "myoner", "samtidighet", "tog-og-tunnel", "romreise", "relativistisk-bevegelsesmengde", "elektron", "gps") + o("lengdekontraksjon", "relativistisk-bevegelsesmengde", "repetisjon-relativitet", "begrep-relativitet")),
 ("gjøre rede for hva som skiller kvanteobjekter fra klassiske objekter, og beskrive situasjoner der kvanteeffekter observeres", []),
 ("utforske og analysere en selvvalgt teoretisk eller praktisk problemstilling i fysikk, og presentere viktige prinsipper, sammenhenger og konsekvenser",
  p("ekte-data", "grunnkurs")),
]

def blokk(fag, mal, url, ROT):
    ut = [f'<h2 id="{fag.lower().replace(" ", "-")}">{fag}</h2>', f'<p>Fra <a href="{url}">Kompetansemål etter {fag.lower()}</a>: «Mål for opplæringen er at eleven skal kunne»</p>', "<ol class=\"km-liste\">"]
    mangler = []
    for i, (tekst, sider) in enumerate(mal, 1):
        ut.append(f"  <li>\n    <p class=\"km-mal\">{tekst}</p>")
        if sider:
            ut.append("    <ul>")
            for sti in sider:
                assert os.path.exists(os.path.join(ROT, sti)), sti
                ut.append(f'      <li><a href="../{sti}">{html.escape(tittel(sti, ROT))}</a> <span class="km-type">{typ(sti)}</span></li>')
            ut.append("    </ul>")
        else:
            ut.append('    <p class="km-tom">Ingen ressurser på fysikklab.no ennå.</p>')
            mangler.append(i)
        ut.append("  </li>")
    ut.append("</ol>")
    return "\n".join(ut), mangler

def bygg(ROT, UT):
    """Skriver kildefilen til opplegg/kompetansemaal.html i mappa UT. Titlene hentes fra sidene i ROT."""
    b1, m1 = blokk("Fysikk 1", F1, "https://www.udir.no/lk20/fys01-02/kompetansemaal-og-vurdering/kv466", ROT)
    b2, m2 = blokk("Fysikk 2", F2, "https://www.udir.no/lk20/fys01-02/kompetansemaal-og-vurdering/kv467", ROT)
    liste = lambda m: ", ".join(map(str, m[:-1])) + " og " + str(m[-1])
    side = f"""tittel: Ressurser etter kompetansemål – fysikklab.no
beskrivelse: Lærerside: Simuleringer, opplegg, programmeringsøvinger, begrepstester og repetisjon på fysikklab.no sortert etter kompetansemålene i Fysikk 1 og Fysikk 2 (FYS01-02).
fagside: undervisningsopplegg.html
fag: Undervisningsopplegg
tema: Til læreren
script: -
meny: undervisningsopplegg.html
---
<h1>Ressurser etter kompetansemål</h1>
<p class="ingress">Her er alt på fysikklab.no sortert etter kompetansemålene i læreplanen i fysikk. Siden viser også hvilke mål som ikke har ressurser ennå. En ressurs kan passe til flere mål.</p>

<div class="tekst opplegg km">
<p>Ordlyden i målene er hentet fra Læreplan i fysikk (FYS01-02), fastsatt av Utdanningsdirektoratet og gjeldende fra 1.8.2021. Se <a href="https://www.udir.no/lk20/fys01-02">læreplanen hos Udir</a> for den offisielle versjonen. Koblingen mellom målene og ressursene er lærerens egen vurdering. Den er ikke laget av Udir.</p>
<p><a href="#fysikk-1">Fysikk 1</a> · <a href="#fysikk-2">Fysikk 2</a></p>
{b1}
{b2}
<h2>Mål uten ressurser</h2>
<p>Fysikk 1: mål {liste(m1)}. Fysikk 2: mål {liste(m2)}. Dette er temaer som ikke har vært gjennomgått med ressurser på siden ennå: elektrisitet, termofysikk, stråling og klima, atommodeller og stjerner i Fysikk 1, og forskningssamarbeid, induksjon og kvantefysikk i Fysikk 2.</p>
</div>
"""
    open(os.path.join(UT, "kompetansemaal.html"), "w", encoding="utf-8").write(side)
