# Kildefiler for repetisjonssidene (opplegg/repetisjon-*.html), med samme mal som repetisjon-felt. Brukes av bygg.py.
# Tallene i fasitene er regnet ut og sjekket med Python. Sjekk nye tall på samme måte.
import os, sys

SIDER = {}

def bygg(UT):
    """Skriver én kildefil per repetisjonsside i mappa UT."""
    for navn, s in SIDER.items():
        open(os.path.join(UT, navn + ".html"), "w", encoding="utf-8").write(s)

def side(navn, tittel, tema, beskr, ingress, oversikt, formler, konstanter, inngang, oppg, fasit, bruk):
    fl = "\n".join(f"    <li>{f}</li>" for f in formler)
    ol = "\n".join(f'  <li><span class="fase {k}">{n}</span><div><p>{t}</p></div></li>' for k, n, t in oppg)
    fa = "\n".join(f"      <li>{t}</li>" for t in fasit)
    assert len(oppg) == len(fasit), navn
    kons = f"\n  <p>{konstanter}</p>" if konstanter else ""
    s = f"""tittel: {tittel} – fysikklab.no
beskrivelse: {beskr}
fagside: undervisningsopplegg.html
fag: Undervisningsopplegg
tema: {tema}
script: -
meny: undervisningsopplegg.html
---
<h1>{tittel}</h1>
<p class="ingress">{ingress}</p>

<div class="tekst opplegg">
{oversikt}

  <h2>Formler</h2>
  <ul>
{fl}
  </ul>{kons}
</div>

<section class="oppgaver" aria-labelledby="oppgaver-tittel">
  <h2 id="oppgaver-tittel">Oppgaver</h2>
  <p class="del-inngang">{inngang}</p>
  <ol class="oppgaveliste">
{ol}
  </ol>

  <details class="fasit">
    <summary>Løsningsforslag</summary>
    <ol>
{fa}
    </ol>
    <p><strong>Bruk i timen:</strong> {bruk}</p>
  </details>
</section>
"""
    SIDER[navn] = s

BRUK = "Passer som repetisjon før en vurdering, som lekse eller som stasjoner i timen. Oppgavene er laget for fysikklab.no og er ikke hentet fra lærebøker eller prøver. Begrepstesten <a href=\"{bt}\">{btnavn}</a> passer som oppvarming."

# ---------- Fysikk 1: Rettlinjet bevegelse ----------
side("repetisjon-bevegelse", "Repetisjon: rettlinjet bevegelse", "Fysikk 1 · Rettlinjet bevegelse",
     "Repetisjon i Fysikk 1: oversikt over fart, akselerasjon og grafer, bevegelseslikningene og blandede oppgaver med løsningsforslag.",
     "Rettlinjet bevegelse handler om å beskrive hvordan posisjonen og farten endrer seg med tiden. Her er en oversikt over grafene og formlene, og blandede oppgaver med løsningsforslag.",
     """  <h2>Grafene og hva de forteller</h2>
  <div class="tabell-ramme">
    <table class="sim-tabell alle tekst-tabell">
      <thead><tr><th scope="col">Graf</th><th scope="col">Stigningstallet er</th><th scope="col">Arealet under grafen er</th></tr></thead>
      <tbody>
        <tr><th scope="row">posisjon s(t)</th><td>farten v</td><td>ikke noe nyttig</td></tr>
        <tr><th scope="row">fart v(t)</th><td>akselerasjonen a</td><td>forflytningen Δs</td></tr>
        <tr><th scope="row">akselerasjon a(t)</th><td>(brukes sjelden)</td><td>fartsendringen Δv</td></tr>
      </tbody>
    </table>
  </div>
  <p>Fart og akselerasjon har retning. Velg en positiv retning, og hold deg til den. Akselerasjonen kan peke motsatt vei av farten. Da minker farten. Når farten er null, kan akselerasjonen godt være forskjellig fra null, for eksempel på toppen av et loddrett kast.</p>""",
     ["Gjennomsnittsfart: v̄ = Δs/Δt. Gjennomsnittsakselerasjon: ā = Δv/Δt.",
      "Konstant akselerasjon: v = v₀ + at, s = v₀t + ½at², v² − v₀² = 2as og s = (v₀ + v)/2 · t.",
      "Fritt fall og loddrett kast: a = −g = −9,81 m/s² med positiv retning oppover, når vi ser bort fra luftmotstand.",
      "Omregning: 1 m/s = 3,6 km/h."], "",
     "Bruk g = 9,81 m/s² og se bort fra luftmotstand hvis ikke noe annet står.",
     [("forklar", "Begrep", "Er påstandene sanne eller usanne? Begrunn svaret.</p><p>a) Når farten er null, er akselerasjonen null.<br>b) Arealet under en v,t-graf er forflytningen.<br>c) Stigningstallet i en s,t-graf er akselerasjonen.<br>d) En ball som kastes rett opp, har like stor fart når den kommer ned til samme høyde.<br>e) Negativ akselerasjon betyr alltid at farten minker."),
      ("test", "Regn", "En bil akselererer jevnt fra 0 til 100 km/h på 8,0 s. Finn akselerasjonen og strekningen bilen kjører. <a href=\"../sim/bevegelsesgrafer.html\">Se grafene i simuleringen.</a>"),
      ("test", "Regn", "En sjåfør kjører i 80 km/h og ser en hindring. Reaksjonstiden er 1,0 s, og bremsene gir akselerasjonen 7,0 m/s². Finn reaksjonslengden, bremselengden og stopplengden. <a href=\"../sim/bremselengde.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Du slipper en stein fra en bru, og den treffer vannet etter 2,4 s. Hvor høyt er brua, og hvor fort treffer steinen vannet? Hvor lang tid tar det før du hører plasket, når lyden går med 340 m/s?"),
      ("test", "Regn", "En ball kastes rett opp med 12 m/s fra 1,5 m over bakken. Hvor høyt over bakken kommer den? Hvor lang tid går det før den treffer bakken, og med hvilken fart? <a href=\"../sim/fritt-fall.html\">Se også Fritt fall.</a>"),
      ("test", "Grafer", "Et tog starter fra ro og akselererer jevnt til 20 m/s på 40 s. Så kjører det med konstant fart i 60 s, og bremser jevnt til stopp på 25 s. Skisser v,t-grafen. Finn strekningen og gjennomsnittsfarten."),
      ("utfordring", "Sammensatt", "Bil A kjører med konstant fart 25 m/s forbi bil B, som står i ro. I samme øyeblikk starter B med akselerasjonen 2,0 m/s². Når og hvor tar B igjen A? Hvilken fart har B da? Forklar hvorfor B da har akkurat dobbelt så stor fart som A."),
     ],
     ["a) Usann. På toppen av et loddrett kast er farten null, men akselerasjonen er g nedover. b) Sann. c) Usann. Stigningstallet er farten. d) Sann, uten luftmotstand. e) Usann. Det avhenger av fortegnet på farten. Hvis både farten og akselerasjonen er negative, øker farten.",
      "v = 100/3,6 = 27,8 m/s. a = Δv/Δt = 27,8/8,0 ≈ 3,5 m/s². s = (v₀ + v)/2 · t = 27,8/2 · 8,0 ≈ 111 m.",
      "v = 22,2 m/s. Reaksjonslengden er 22,2 · 1,0 = 22 m. Bremselengden er v²/(2a) = 22,2²/14 ≈ 35 m. Stopplengden er 57 m.",
      "h = ½gt² = ½ · 9,81 · 2,4² ≈ 28 m. v = gt ≈ 23,5 m/s. Lyden bruker 28,3/340 ≈ 0,083 s, så du hører plasket etter 2,48 s.",
      "Toppen: v² − v₀² = 2as gir 12²/(2 · 9,81) ≈ 7,3 m over startpunktet, altså 8,8 m over bakken. Med positiv retning opp: −1,5 = 12t − 4,905t² gir t ≈ 2,57 s. Farten er v = √(12² + 2 · 9,81 · 1,5) ≈ 13,2 m/s nedover.",
      "Grafen går rett opp til 20 m/s, er vannrett i 60 s og går rett ned til 0. Strekningen er arealet: ½ · 20 · 40 + 20 · 60 + ½ · 20 · 25 = 400 + 1200 + 250 = 1850 m. Gjennomsnittsfarten er 1850/125 = 14,8 m/s.",
      "A: s = 25t. B: s = ½ · 2,0 · t² = t². Like: t² = 25t gir t = 25 s, og s = 625 m. B har da v = 2,0 · 25 = 50 m/s. De har kjørt like langt på like lang tid, så de har samme gjennomsnittsfart, 25 m/s. For B, som starter fra ro med konstant akselerasjon, er gjennomsnittsfarten halvparten av sluttfarten."],
     BRUK.format(bt="begrep-krefter.html", btnavn="Krefter og bevegelse"))

# ---------- Fysikk 1: Krefter ----------
side("repetisjon-krefter", "Repetisjon: krefter", "Fysikk 1 · Krefter",
     "Repetisjon i Fysikk 1: Newtons tre lover, de vanligste kreftene, kraftsum på skråplan og blandede oppgaver med løsningsforslag.",
     "Med Newtons lover kan vi regne ut bevegelsen når vi kjenner kreftene, og omvendt. Her er en oversikt over lovene og kreftene, og blandede oppgaver med løsningsforslag.",
     """  <h2>Newtons lover</h2>
  <div class="tabell-ramme">
    <table class="sim-tabell alle tekst-tabell">
      <tbody>
        <tr><th scope="row">Første lov</th><td>Når summen av kreftene er null, er gjenstanden i ro eller har konstant fart i en rett linje.</td></tr>
        <tr><th scope="row">Andre lov</th><td>ΣF = ma. Kraftsummen og akselerasjonen har samme retning.</td></tr>
        <tr><th scope="row">Tredje lov</th><td>Når A virker på B med en kraft, virker B på A med en like stor kraft i motsatt retning. Kraft og motkraft virker på forskjellige gjenstander og opphever ikke hverandre.</td></tr>
      </tbody>
    </table>
  </div>
  <h2>Slik løser du en kraftoppgave</h2>
  <ol>
    <li>Velg én gjenstand, og tegn bare kreftene som virker på den.</li>
    <li>Velg en positiv retning, gjerne i akselerasjonsretningen. På et skråplan: langs og vinkelrett på planet.</li>
    <li>Skriv Newtons andre lov for hver retning, og løs likningene.</li>
  </ol>""",
     ["Tyngde: G = mg. Friksjon ved glidning: R = μN. Hvilefriksjonen er høyst μ<sub>s</sub>N.",
      "Luftmotstand: L = kv (lav fart) eller L = kv² (høy fart). Terminalfart når L = mg.",
      "Skråplan med vinkel θ: tyngdekomponenten langs planet er mg sin θ, og vinkelrett på planet mg cos θ. Uten andre krefter vinkelrett på planet er N = mg cos θ.",
      "Heis: N = m(g + a), med a positiv oppover."], "",
     "Bruk g = 9,81 m/s².",
     [("forklar", "Begrep", "Er påstandene sanne eller usanne? Begrunn svaret.</p><p>a) Normalkraften er alltid like stor som tyngden.<br>b) Kraft og motkraft opphever hverandre.<br>c) En bil som kjører med konstant fart i en rett linje, har kraftsum null.<br>d) Friksjonskraften peker alltid motsatt av fartsretningen.<br>e) En tung og en lett stein faller like fort uten luftmotstand."),
      ("test", "Regn", "En person på 70 kg står på en badevekt i en heis som akselererer oppover med 1,2 m/s². Finn normalkraften og hva vekta viser. <a href=\"../sim/heis.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En kasse på 6,0 kg trekkes bortover et gulv med en vannrett kraft på 40 N. Friksjonstallet er 0,30. Finn akselerasjonen. <a href=\"../sim/friksjon.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En kloss på 2,0 kg glir ned et skråplan med helningsvinkel 30°. Friksjonstallet er 0,20. Finn normalkraften, friksjonskraften og akselerasjonen. <a href=\"../sim/skraaplan.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En vogn på 0,80 kg står på et bord uten friksjon. Den er koblet med en snor over en trinse til et lodd på 0,20 kg som henger fritt. Finn akselerasjonen og snorkraften. <a href=\"../sim/vogn-og-lodd.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En fallskjermhopper på 80 kg har terminalfarten 55 m/s før skjermen åpnes og 5,0 m/s etterpå. Luftmotstanden er L = kv². Finn k før og etter at skjermen åpnes. Hvor stor er akselerasjonen når farten er 30 m/s, før skjermen åpnes? <a href=\"../sim/luftmotstand.html\">Se Fall med luftmotstand.</a>"),
      ("utfordring", "Sammensatt", "En bil på 1200 kg i 90 km/h bråbremser og stopper på 40 m. Finn bremsekraften. Hvor stort må friksjonstallet mellom dekk og vei minst være? Hva skjer med bremselengden på glatt føre med μ = 0,20?"),
     ],
     ["a) Usann. For eksempel er N = mg cos θ på et skråplan og N = m(g + a) i en heis. b) Usann. De virker på forskjellige gjenstander. c) Sann (Newtons første lov). d) Usann. Hvilefriksjonen på en kloss som ligger i ro på et skråplan, peker oppover planet, og friksjonen på drivhjulene til en bil peker framover. e) Sann. a = mg/m = g.",
      "N − mg = ma gir N = 70 · (9,81 + 1,2) ≈ 771 N. Vekta viser N/g ≈ 78,6 kg.",
      "R = 0,30 · 6,0 · 9,81 ≈ 17,7 N. a = (40 − 17,7)/6,0 ≈ 3,7 m/s².",
      "N = mg cos 30° ≈ 17,0 N. R = μN ≈ 3,4 N. a = (mg sin 30° − R)/m = 9,81 · (0,500 − 0,20 · 0,866) ≈ 3,2 m/s².",
      "Vi ser på vogna og loddet som ett system: a = m<sub>lodd</sub>g/(m<sub>vogn</sub> + m<sub>lodd</sub>) = 0,20 · 9,81/1,00 ≈ 1,96 m/s². Snorkraften akselererer vogna: S = 0,80 · 1,96 ≈ 1,57 N, mindre enn tyngden av loddet (1,96 N).",
      "Ved terminalfart er kv² = mg. Før: k = 80 · 9,81/55² ≈ 0,26 kg/m. Etter: k = 80 · 9,81/5,0² ≈ 31 kg/m, over hundre ganger så stort. Ved 30 m/s: a = g − kv²/m = 9,81 − 0,259 · 900/80 ≈ 6,9 m/s².",
      "v = 25 m/s. a = v²/(2s) = 625/80 ≈ 7,8 m/s², og F = ma ≈ 9,4 kN. Friksjonen må gi denne kraften: μmg ≥ ma, så μ ≥ a/g ≈ 0,80. Med μ = 0,20 er a = 0,20 · 9,81 ≈ 1,96 m/s², og bremselengden blir v²/(2a) ≈ 160 m, fire ganger så lang."],
     BRUK.format(bt="begrep-krefter.html", btnavn="Krefter og bevegelse"))

# ---------- Fysikk 1: Mekanisk energi ----------
side("repetisjon-energi", "Repetisjon: arbeid og energi", "Fysikk 1 · Mekanisk energi",
     "Repetisjon i Fysikk 1: arbeid, kinetisk og potensiell energi, bevaring av mekanisk energi, friksjonsarbeid, effekt og virkningsgrad, med blandede oppgaver og løsningsforslag.",
     "Energi kan gå over fra en form til en annen, men forsvinner aldri. Med energibevaring kan vi ofte finne farten uten å vite noe om banen. Her er en oversikt og blandede oppgaver med løsningsforslag.",
     """  <h2>Når er den mekaniske energien bevart?</h2>
  <div class="tabell-ramme">
    <table class="sim-tabell alle tekst-tabell">
      <thead><tr><th scope="col">Situasjon</th><th scope="col">Energiregnskap</th></tr></thead>
      <tbody>
        <tr><th scope="row">Bare tyngden gjør arbeid (normalkraft og snorkraft vinkelrett på farten gjør ikke arbeid)</th><td>E<sub>k</sub> + E<sub>p</sub> er konstant</td></tr>
        <tr><th scope="row">Friksjon eller luftmotstand</th><td>E<sub>k0</sub> + E<sub>p0</sub> = E<sub>k</sub> + E<sub>p</sub> + varme. Varmen er lik friksjonsarbeidet, Rs.</td></tr>
        <tr><th scope="row">En ytre kraft gjør arbeid (motor, person)</th><td>Arbeidet fra kraften kommer i tillegg: W = ΔE<sub>k</sub> + ΔE<sub>p</sub> + varme</td></tr>
      </tbody>
    </table>
  </div>""",
     ["Arbeid: W = Fs cos α, der α er vinkelen mellom kraften og forflytningen.",
      "Kinetisk energi: E<sub>k</sub> = ½mv². Potensiell energi: E<sub>p</sub> = mgh.",
      "Arbeid–energi: Det totale arbeidet på en gjenstand er lik endringen i kinetisk energi, W<sub>tot</sub> = ΔE<sub>k</sub>.",
      "Effekt: P = W/t = Fv. Virkningsgrad: η = nyttig energi / tilført energi."], "",
     "Bruk g = 9,81 m/s².",
     [("forklar", "Begrep", "Er påstandene sanne eller usanne? Begrunn svaret.</p><p>a) Normalkraften gjør ikke arbeid på en vogn i en berg-og-dal-bane.<br>b) Dobbel fart gir dobbel kinetisk energi.<br>c) Uten friksjon får en kloss samme fart nederst i en bratt og en slak bakke med samme høyde.<br>d) Når du bærer en sekk bortover med konstant fart, gjør du positivt arbeid på sekken.<br>e) Energi som blir til varme, er tapt for alltid."),
      ("test", "Regn", "En ball kastes rett ned med 5,0 m/s fra 10 m høyde. Hvor fort treffer den bakken? Ville svaret vært annerledes hvis ballen ble kastet vannrett med 5,0 m/s?"),
      ("test", "Regn", "En vogn i en berg-og-dal-bane har farten 2,0 m/s på toppen av en bakke 25 m over bakken. Hvor fort går den 8,0 m over bakken? I hvilken høyde har den farten 10 m/s? Se bort fra friksjon. <a href=\"../sim/berg-og-dal.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Et akebrett med barn har massen 40 kg og starter i ro på toppen av en 12 m høy bakke. Nederst har det farten 11 m/s. Hvor mye energi ble til varme? Bakken er 60 m lang. Hvor stor var den gjennomsnittlige friksjonskraften?"),
      ("test", "Regn", "En heis på 600 kg løftes 20 m på 25 s med konstant fart. Finn arbeidet og effekten. Motoren har virkningsgrad 75 %. Hvor stor effekt må motoren få tilført?"),
      ("test", "Regn", "En sprettball slippes fra 1,80 m og spretter opp til 1,35 m. Hvor stor del av energien er igjen etter sprettet? Hvor høyt kommer ballen etter tre sprett hvis den mister like stor del hver gang? <a href=\"../sim/sprettball.html\">Sjekk med simuleringen.</a>"),
      ("utfordring", "Sammensatt", "En elev på 65 kg løper opp en trapp med høyden 3,0 m på 4,0 s. Finn effekten mot tyngden. En elev hevder at hun har like stor effekt som en støvsuger på 500 W. Har hun rett? Hvorfor bruker kroppen likevel mye mer energi enn mgh? <a href=\"../sim/trappelop.html\">Se Trappeløp.</a>"),
     ],
     ["a) Sann. Normalkraften står vinkelrett på farten. b) Usann. Den blir fire ganger så stor. c) Sann. v = √(2gh). d) Usann. Kraften fra deg peker opp, og bevegelsen er vannrett, så W = 0. e) Usann. Energien finnes fortsatt, men som varme har den lav kvalitet og er vanskelig å gjøre om til mekanisk energi igjen.",
      "½v² = ½v₀² + gh gir v = √(5,0² + 2 · 9,81 · 10) ≈ 14,9 m/s. Svaret er det samme når ballen kastes vannrett, fordi energien ikke avhenger av retningen. Bare retningen på farten blir en annen.",
      "v = √(2,0² + 2 · 9,81 · 17) ≈ 18,4 m/s. For 10 m/s: h = 25 + (2,0² − 10²)/(2 · 9,81) ≈ 20,1 m.",
      "E<sub>p</sub> = 40 · 9,81 · 12 ≈ 4710 J og E<sub>k</sub> = ½ · 40 · 11² = 2420 J. Varmen er 2290 J, og R = 2290/60 ≈ 38 N.",
      "W = mgh = 600 · 9,81 · 20 ≈ 118 kJ. P = W/t ≈ 4,7 kW. Tilført effekt: 4,7/0,75 ≈ 6,3 kW.",
      "1,35/1,80 = 0,75, så 75 % av den mekaniske energien er igjen. Etter tre sprett: 1,80 · 0,75³ ≈ 0,76 m.",
      "P = mgh/t = 65 · 9,81 · 3,0/4,0 ≈ 480 W, så hun har nesten rett. Kroppen har en virkningsgrad på bare rundt 20–25 %. Musklene lager mye varme, og bena må også akselereres og bremses i hvert steg."],
     BRUK.format(bt="begrep-energi.html", btnavn="Arbeid og energi"))

# ---------- Fysikk 1: Bevegelsesmengde ----------
side("repetisjon-bevegelsesmengde", "Repetisjon: bevegelsesmengde og støt", "Fysikk 1 · Bevegelsesmengde og støt",
     "Repetisjon i Fysikk 1: bevegelsesmengde, impuls, bevaringsloven, elastiske og uelastiske støt og rekyl, med blandede oppgaver og løsningsforslag.",
     "I et støt er kreftene store og kortvarige, og vanskelige å måle. Men bevegelsesmengden er bevart, og det gjør støt enkle å regne på. Her er en oversikt og blandede oppgaver med løsningsforslag.",
     """  <h2>Tre typer støt</h2>
  <div class="tabell-ramme">
    <table class="sim-tabell alle tekst-tabell">
      <thead><tr><th scope="col">Støt</th><th scope="col">Bevegelsesmengde</th><th scope="col">Kinetisk energi</th></tr></thead>
      <tbody>
        <tr><th scope="row">Elastisk</th><td>bevart</td><td>bevart</td></tr>
        <tr><th scope="row">Uelastisk</th><td>bevart</td><td>noe blir til varme, lyd og deformasjon</td></tr>
        <tr><th scope="row">Fullstendig uelastisk (henger sammen etterpå)</th><td>bevart</td><td>størst mulig tap</td></tr>
      </tbody>
    </table>
  </div>
  <p>Bevegelsesmengden er bevart når de ytre kreftene er små i forhold til kreftene i støtet. Husk at bevegelsesmengde er en vektor. Velg en positiv retning, og gi farten minus når den peker motsatt vei.</p>""",
     ["Bevegelsesmengde: p = mv.",
      "Impuls: I = FΔt = Δp. Med varierende kraft er impulsen arealet under F,t-grafen.",
      "Bevaring: m₁v₁ + m₂v₂ = m₁u₁ + m₂u₂.",
      "Kinetisk energi: E<sub>k</sub> = ½mv² = p²/(2m)."], "",
     "Bruk g = 9,81 m/s². Velg positiv retning i den første fartsretningen.",
     [("forklar", "Begrep", "Er påstandene sanne eller usanne? Begrunn svaret.</p><p>a) Bevegelsesmengden er bare bevart i elastiske støt.<br>b) En ball som spretter rett tilbake fra en vegg, får større endring i bevegelsesmengde enn en ball som stopper.<br>c) En kollisjonspute gjør at impulsen på hodet blir mindre.<br>d) Når et gevær skytes, får geværet og kula like stor bevegelsesmengde.<br>e) I et fullstendig uelastisk støt forsvinner all kinetisk energi."),
      ("test", "Regn", "En bil på 1500 kg i 20 m/s kjører inn i en bil på 1000 kg som står i ro. Bilene henger sammen etterpå. Finn farten rett etter støtet og hvor stor del av den kinetiske energien som går tapt. <a href=\"../sim/vognstot.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En fotball på 0,43 kg ligger i ro og blir sparket. Den får farten 25 m/s, og foten er i kontakt med ballen i 8,0 ms. Finn impulsen og den gjennomsnittlige kraften. <a href=\"../sim/impuls.html\">Se Myk landing.</a>"),
      ("test", "Regn", "Vogn A på 0,50 kg med farten 0,60 m/s støter elastisk mot vogn B på 0,25 kg som står i ro. Etter støtet har A farten 0,20 m/s i samme retning. Finn farten til B, og vis at den kinetiske energien er bevart."),
      ("test", "Regn", "En kanon på 800 kg står fritt og skyter en kule på 5,0 kg med farten 300 m/s. Hvilken fart får kanonen? Hvor mye kinetisk energi får kula og kanonen? <a href=\"../sim/rekyl.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En kule på 10 g blir skutt inn i en trekloss på 2,0 kg som henger i snorer. Klossen og kula svinger opp 5,0 cm. Finn farten til klossen rett etter støtet og farten til kula. Hvorfor kan vi ikke bruke energibevaring for selve støtet? <a href=\"../sim/ballistisk-pendel.html\">Sjekk med simuleringen.</a>"),
      ("utfordring", "Sammensatt", "En ball på 0,15 kg ligger i ro og blir slått med et balltre. Kraften stiger jevnt fra 0 til 600 N og faller jevnt til 0 igjen. Hele slaget varer 0,020 s. Skisser F,t-grafen. Finn impulsen og farten til ballen. Hvor stor er den gjennomsnittlige kraften?"),
     ],
     ["a) Usann. Den er bevart i alle støt når de ytre kreftene er små. Det er den kinetiske energien som bare er bevart i elastiske støt. b) Sann. Δp = 2mv mot mv. c) Usann. Impulsen er den samme, men den varer lenger, så kraften blir mindre. d) Sann for størrelsen, men retningene er motsatte, så summen er null. e) Usann. Den kinetiske energien til tyngdepunktet er igjen, for eksempel 60 % i oppgave 2.",
      "1500 · 20 = 2500 · v gir v = 12 m/s. E<sub>k</sub> før: ½ · 1500 · 20² = 300 kJ. Etter: ½ · 2500 · 12² = 180 kJ. 120 kJ, altså 40 %, går tapt.",
      "I = Δp = 0,43 · 25 ≈ 10,8 N s. F = I/Δt = 10,75/0,0080 ≈ 1,3 kN.",
      "0,50 · 0,60 = 0,50 · 0,20 + 0,25 · u<sub>B</sub> gir u<sub>B</sub> = 0,80 m/s. E<sub>k</sub> før: ½ · 0,50 · 0,60² = 0,090 J. Etter: ½ · 0,50 · 0,20² + ½ · 0,25 · 0,80² = 0,010 + 0,080 = 0,090 J.",
      "0 = 5,0 · 300 + 800 · v gir v ≈ −1,9 m/s, bakover. Kula får ½ · 5,0 · 300² = 225 kJ, og kanonen ½ · 800 · 1,875² ≈ 1,4 kJ. Den letteste får mest energi.",
      "Etter støtet: ½v² = gh gir v = √(2 · 9,81 · 0,050) ≈ 0,99 m/s. Bevegelsesmengde i støtet: 0,010 · v<sub>kule</sub> = 2,01 · 0,99 gir v<sub>kule</sub> ≈ 199 m/s. Støtet er fullstendig uelastisk: Kula har 198 J før, og klossen og kula har bare 0,99 J etter. Resten blir til varme og deformasjon i treet.",
      "Grafen er en trekant. Impulsen er arealet: ½ · 0,020 · 600 = 6,0 N s. v = I/m = 6,0/0,15 = 40 m/s. Gjennomsnittskraften er I/Δt = 300 N."],
     BRUK.format(bt="begrep-bevegelsesmengde.html", btnavn="Bevegelsesmengde og støt"))

# ---------- Fysikk 2: Kast, krefter i 2D og sirkelbevegelse ----------
side("repetisjon-mekanikk-2", "Repetisjon: kast og sirkelbevegelse", "Fysikk 2 · Sirkelbevegelse",
     "Repetisjon i Fysikk 2: bevegelse i to dimensjoner, horisontalt og skrått kast, krefter i to dimensjoner og sirkelbevegelse, med blandede oppgaver og løsningsforslag.",
     "I Fysikk 2 blir bevegelsen todimensjonal. Nøkkelen er å dele vektorene i komponenter og behandle x- og y-retningen hver for seg. I sirkelbevegelse peker akselerasjonen inn mot sentrum. Her er en oversikt og blandede oppgaver med løsningsforslag.",
     """  <h2>Kast og sirkelbevegelse side om side</h2>
  <div class="tabell-ramme">
    <table class="sim-tabell alle tekst-tabell">
      <thead><tr><th scope="col"></th><th scope="col">Kast (uten luftmotstand)</th><th scope="col">Jevn sirkelbevegelse</th></tr></thead>
      <tbody>
        <tr><th scope="row">Akselerasjon</th><td>g, rett ned, konstant</td><td>v²/r, inn mot sentrum, retningen endres hele tiden</td></tr>
        <tr><th scope="row">Kraftsum</th><td>tyngden mg</td><td>sentripetalkraften mv²/r, summen av de virkelige kreftene inn mot sentrum</td></tr>
        <tr><th scope="row">Fart</th><td>vₓ konstant, v<sub>y</sub> endres</td><td>konstant størrelse, retningen endres</td></tr>
        <tr><th scope="row">Banen</th><td>parabel</td><td>sirkel</td></tr>
      </tbody>
    </table>
  </div>
  <p>Sentripetalkraften er ikke en ny kraft. Det er navnet på kraftsummen inn mot sentrum. Den kan være snorkraft, friksjon, normalkraft, tyngde eller en sum av flere krefter.</p>""",
     ["Kast: x = v₀ₓt og y = y₀ + v₀ᵧt − ½gt², med v₀ₓ = v₀ cos α og v₀ᵧ = v₀ sin α. vₓ = v₀ₓ og vᵧ = v₀ᵧ − gt.",
      "Sirkelbevegelse: v = 2πr/T = ωr og a = v²/r = ω²r = 4π²r/T².",
      "Dosert sving uten friksjon: tan θ = v²/(gr). Flat sving: μmg ≥ mv²/r.",
      "Vertikal sirkelbevegelse: på toppen mg + N = mv²/r, i bunnen N − mg = mv²/r. Minste fart på toppen: v = √(gr).",
      "Sirkelbane rundt en planet: GMm/r² = mv²/r gir v = √(GM/r)."],
     "Konstanter: g = 9,81 m/s², G = 6,67 · 10⁻¹¹ N m²/kg², GM for jorda = 3,986 · 10¹⁴ m³/s² og jordradius 6371 km.",
     "Se bort fra luftmotstand hvis ikke noe annet står.",
     [("forklar", "Begrep", "Er påstandene sanne eller usanne? Begrunn svaret.</p><p>a) På toppen av et skrått kast er akselerasjonen null.<br>b) En bil som kjører gjennom en sving med konstant fart, har akselerasjon.<br>c) Sentrifugalkraften presser deg utover i en karusell.<br>d) En kule som slippes, og en som skytes ut vannrett fra samme høyde, treffer bakken samtidig.<br>e) En satellitt i bane er vektløs fordi det ikke er tyngdekraft der."),
      ("test", "Regn", "En ball triller utfor en bordkant 0,90 m over gulvet med farten 2,5 m/s. Hvor lang tid bruker den, hvor langt fra bordet lander den, og med hvilken fart og vinkel treffer den gulvet? <a href=\"../programmering/python-horisontalt-kast.html\">Se også Horisontalt kast med Eulers metode.</a>"),
      ("test", "Regn", "En ball sparkes fra bakken med 20 m/s, 35° over vannrett. Finn tiden i lufta, rekkevidden og den største høyden. Hvilken annen vinkel gir samme rekkevidde? <a href=\"../sim/skratt-kast.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Et lodd på 5,0 kg henger midt på en snor som er festet i to punkter i samme høyde. Hver halvdel av snora danner 30° med vannrett. Finn snorkraften. Hva skjer med snorkraften når snora strammes slik at vinkelen blir mindre? <a href=\"../sim/lodd-i-snorer.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En bil kjører i en flat sving med radius 50 m. Friksjonstallet er 0,70. Hva er den største farten bilen kan ha uten å skli? Hva blir den på glatt føre med μ = 0,15? <a href=\"../sim/sirkelbevegelse.html\">Se Sirkelbevegelse.</a>"),
      ("test", "Regn", "En berg-og-dal-bane har en vertikal loop med radius 8,0 m. Hva er den minste farten vogna kan ha på toppen? I bunnen av en dal med samme radius har en passasjer på 60 kg farten 20 m/s. Finn normalkraften. Hvor mange g kjenner passasjeren? <a href=\"../sim/loddrett-sirkel.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "En sving på en motorvei har radius 200 m og skal tas i 30 m/s uten hjelp fra friksjon. Hvor mye må svingen doseres? <a href=\"../sim/dosert-sving.html\">Sjekk med simuleringen.</a>"),
      ("utfordring", "Sammensatt", "Den internasjonale romstasjonen går i en tilnærmet sirkelbane 420 km over bakken. Finn farten og omløpstiden. Hvor stor er tyngdeakselerasjonen der, sammenlignet med på bakken? Hvorfor svever astronautene likevel? <a href=\"../programmering/python-satellittbane.html\">Se også Satellittbane med Eulers metode.</a>"),
     ],
     ["a) Usann. Akselerasjonen er g nedover hele tiden. b) Sann. Retningen på farten endres, og akselerasjonen peker inn mot sentrum. c) Usann. Kraften fra setet eller veggen peker innover. Følelsen av å bli presset ut kommer av at kroppen vil fortsette rett fram. d) Sann. Den loddrette bevegelsen er den samme. e) Usann. Tyngdekraften er nesten like stor som på bakken. Satellitten og alt i den faller fritt sammen.",
      "t = √(2h/g) = √(2 · 0,90/9,81) ≈ 0,43 s. x = 2,5 · 0,43 ≈ 1,07 m. vᵧ = gt ≈ 4,2 m/s, så v = √(2,5² + 4,2²) ≈ 4,9 m/s, 59° under vannrett.",
      "v₀ₓ = 16,4 m/s og v₀ᵧ = 11,5 m/s. t = 2v₀ᵧ/g ≈ 2,34 s. Rekkevidden er v₀ₓt ≈ 38 m. Største høyde: v₀ᵧ²/(2g) ≈ 6,7 m. 55° gir samme rekkevidde, fordi sin(2 · 35°) = sin(2 · 55°).",
      "Loddrett: 2S sin 30° = mg, så S = 5,0 · 9,81/(2 · 0,50) ≈ 49 N, like stor som tyngden. Mindre vinkel gir mindre sin, og snorkraften blir større. En helt rett snor er umulig.",
      "μmg = mv²/r gir v = √(μgr) = √(0,70 · 9,81 · 50) ≈ 18,5 m/s ≈ 67 km/h. Med μ = 0,15: √(0,15 · 9,81 · 50) ≈ 8,6 m/s ≈ 31 km/h.",
      "På toppen må N ≥ 0, så v ≥ √(gr) = √(9,81 · 8,0) ≈ 8,9 m/s. I bunnen: N = m(g + v²/r) = 60 · (9,81 + 400/8,0) ≈ 3,6 kN. Det er 6,1 ganger tyngden, så passasjeren kjenner 6,1 g.",
      "tan θ = v²/(gr) = 900/(9,81 · 200) ≈ 0,459, så θ ≈ 25°.",
      "r = 6791 km. v = √(GM/r) ≈ 7,66 km/s, og T = 2πr/v ≈ 92,8 min. g(r) = GM/r² ≈ 8,6 m/s², 88 % av verdien på bakken. Astronautene og romstasjonen faller fritt med samme akselerasjon, så det er ingen normalkraft mellom dem."],
     BRUK.format(bt="begrep-kast-sirkel.html", btnavn="Kast og sirkelbevegelse"))

# ---------- Fysikk 2: Relativitet ----------
side("repetisjon-relativitet", "Repetisjon: spesiell relativitetsteori", "Fysikk 2 · Spesiell relativitetsteori",
     "Repetisjon i Fysikk 2: postulatene, tidsforlengelse, lengdekontraksjon, samtidighet, relativistisk bevegelsesmengde og energi, med blandede oppgaver og løsningsforslag.",
     "Den spesielle relativitetsteorien bygger på to enkle postulater, men følgene er overraskende. Her er en oversikt over begrepene og formlene, og blandede oppgaver med løsningsforslag.",
     """  <h2>Hvem måler hva?</h2>
  <div class="tabell-ramme">
    <table class="sim-tabell alle tekst-tabell">
      <thead><tr><th scope="col">Størrelse</th><th scope="col">Egenverdien måles</th><th scope="col">Sett fra et system der gjenstanden beveger seg</th></tr></thead>
      <tbody>
        <tr><th scope="row">Tid</th><td>av en klokke som er med på begge hendelsene (egentid t₀)</td><td>lengre: t = γt₀ (tidsforlengelse)</td></tr>
        <tr><th scope="row">Lengde</th><td>i systemet der gjenstanden er i ro (egenlengde L₀)</td><td>kortere i fartsretningen: L = L₀/γ (lengdekontraksjon)</td></tr>
        <tr><th scope="row">Samtidighet</th><td>to hendelser kan være samtidige i ett system</td><td>men ikke i et annet som beveger seg langs linja mellom dem</td></tr>
      </tbody>
    </table>
  </div>
  <p><strong>Postulatene:</strong> 1) Fysikkens lover er de samme i alle treghetssystemer. 2) Lysfarten i vakuum er den samme for alle observatører, uansett hvordan lyskilden beveger seg.</p>""",
     ["Lorentzfaktoren: γ = 1/√(1 − v²/c²). γ ≥ 1, og γ går mot uendelig når v går mot c.",
      "Tidsforlengelse: t = γt₀. Lengdekontraksjon: L = L₀/γ.",
      "Bevegelsesmengde: p = γmv. Hvileenergi: E₀ = mc². Total energi: E = γmc². Kinetisk energi: E<sub>k</sub> = (γ − 1)mc².",
      "Energi og bevegelsesmengde: E² = (pc)² + (mc²)²."],
     "Konstanter: c = 3,00 · 10⁸ m/s, m<sub>e</sub>c² = 0,511 MeV, m<sub>p</sub> = 1,673 · 10⁻²⁷ kg, 1 lysår er avstanden lyset går på ett år.",
     "Oppgavene bruker fart som en brøkdel av c. Regn med minst tre gjeldende siffer i γ.",
     [("forklar", "Begrep", "Er påstandene sanne eller usanne? Begrunn svaret.</p><p>a) En astronaut i et raskt romskip merker at klokka hennes går sakte.<br>b) Lys fra en lykt på et romskip som flyr med 0,5c, har farten 1,5c sett fra jorda.<br>c) To hendelser som er samtidige for én observatør, er samtidige for alle.<br>d) Et romskip trekkes sammen i fartsretningen, men ikke på tvers av den.<br>e) Med en sterk nok motor kan et romskip nå lysfarten."),
      ("test", "Regn", "Regn ut γ for v = 0,60c, 0,80c og 0,99c. Hvor stor må farten være for at γ skal bli 2? <a href=\"../sim/lysklokke.html\">Sjekk med Lysklokka.</a>"),
      ("test", "Regn", "Myoner lages 15 km over bakken og har farten 0,995c. Gjennomsnittlig levetid i ro er 2,2 µs. Hvor lang tid bruker de ned, målt fra jorda og målt av myonene? Hvor mange levetider tar turen i hvert system? Hvor tykk er atmosfæren sett fra myonene? <a href=\"../sim/myoner.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Et romskip reiser til en stjerne 4,37 lysår unna med farten 0,90c. Hvor lang tid tar reisen målt fra jorda og målt om bord? Hvor lang er avstanden målt fra romskipet? <a href=\"../sim/romreise.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Et tog har egenlengden 200 m og kjører gjennom en tunnel med egenlengde 180 m med farten 0,60c. Hvor langt er toget sett fra tunnelen? Er toget helt inne i tunnelen et øyeblikk? Hvor lang er tunnelen sett fra toget? <a href=\"../sim/tog-og-tunnel.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Et elektron akselereres fra ro gjennom en spenning på 1,0 MV. Finn den kinetiske energien, den totale energien, γ og farten. Hvilken fart ville du fått uten relativitetsteori? <a href=\"../sim/elektron.html\">Sjekk med simuleringen.</a>"),
      ("test", "Regn", "Finn bevegelsesmengden til et proton med farten 0,80c. Hvor mange ganger større er den enn den klassiske verdien mv? <a href=\"../sim/relativistisk-bevegelsesmengde.html\">Se Konstant kraft og lysfarten.</a>"),
      ("utfordring", "Sammensatt", "Sola stråler ut 3,83 · 10²⁶ W. Hvor mye minker massen til sola per sekund? Sola har massen 1,99 · 10³⁰ kg. Hvor stor del av massen mister den på 10 milliarder år?"),
     ],
     ["a) Usann. I sitt eget system går alt som vanlig (første postulat). b) Usann. Lyset har farten c for alle (andre postulat). c) Usann. Samtidighet er relativ. d) Sann. e) Usann. Energien E = γmc² går mot uendelig når v går mot c.",
      "γ = 1,25, 1,67 og 7,09. γ = 2 gir 1 − v²/c² = 1/4, altså v = √0,75 c ≈ 0,866c.",
      "γ ≈ 10,0. Fra jorda: t = 15 000/(0,995 · 3,00 · 10⁸) ≈ 50 µs, som er 22,8 levetider i ro. Myonenes egentid er t/γ ≈ 5,0 µs, bare 2,3 levetider. Sett fra myonene er atmosfæren 15 km/γ ≈ 1,5 km tykk.",
      "Fra jorda: t = 4,37 år/0,90 ≈ 4,86 år. γ = 2,29, så om bord går det 4,86/2,29 ≈ 2,12 år. Avstanden målt fra romskipet er 4,37/2,29 ≈ 1,91 lysår, og 1,91/0,90 = 2,12 år stemmer.",
      "γ = 1,25. Toget er 200/1,25 = 160 m sett fra tunnelen, kortere enn tunnelen, så det er helt inne et øyeblikk sett fra tunnelen. Sett fra toget er tunnelen 180/1,25 = 144 m, og toget er aldri helt inne. Begge har rett i sitt system, fordi «fronten er ute samtidig som bakenden er inne» er to hendelser som er samtidige bare i ett av systemene.",
      "E<sub>k</sub> = eU = 1,0 MeV. E = E<sub>k</sub> + mc² = 1,511 MeV, og γ = 1,511/0,511 ≈ 2,96. v = c√(1 − 1/γ²) ≈ 0,94c. Klassisk: ½mv² = eU gir v = c√(2 · 1,0/0,511) ≈ 1,98c, som er umulig.",
      "γ = 1,667. p = γmv = 1,667 · 1,673 · 10⁻²⁷ · 0,80 · 3,00 · 10⁸ ≈ 6,7 · 10⁻¹⁹ kg m/s. Det er γ ≈ 1,67 ganger den klassiske verdien.",
      "Δm/Δt = P/c² = 3,83 · 10²⁶/(3,00 · 10⁸)² ≈ 4,3 · 10⁹ kg/s, over fire millioner tonn per sekund. På 10 milliarder år (3,16 · 10¹⁷ s) blir det 1,3 · 10²⁷ kg, som er 0,07 % av massen."],
     BRUK.format(bt="begrep-relativitet.html", btnavn="Spesiell relativitetsteori"))
