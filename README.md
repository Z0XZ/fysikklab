# lektorbo.no

Fysikksimuleringer og undervisningsopplegg for Fysikk 1 og Fysikk 2.

Ren HTML, CSS og JavaScript uten byggesteg. Åpne `index.html` i en nettleser for å se siden lokalt.

| Fil | Innhold |
|---|---|
| `index.html` | Forsiden |
| `simuleringer.html` | Inngang til Fysikk 1 og Fysikk 2 |
| `fysikk-1.html`, `fysikk-2.html` | Fagsidene med simuleringene sortert etter tema |
| `sim/` | Én side per simulering, med oppgaver og løsningsforslag |
| `undervisningsopplegg.html` | Undervisningsopplegg |
| `programmering.html` | Python i fysikk |
| `om-meg.html` | Om meg |
| `css/style.css` | All styling, farger øverst i filen |
| `js/kast.js` | Simuleringen på forsiden |
| `js/tema.js` | Knappen for lys og mørk modus |
| `js/to-baner.js` | To baner med samme fallhøyde (Fysikk 1) |
| `js/lysklokke.js` | Lysklokka (Fysikk 2) |
| `js/felles.js` | Felles hjelpefunksjoner for de nyeste simuleringene (lerret, avspilling, akser, tallformat) |
| `js/pendel.js`, `js/berg-og-dal.js`, `js/sprettball.js`, `js/trappelop.js` | Fysikk 1: pendel med pinne, berg-og-dal-bane, sprettball, trappeløp |
| `js/vognstot.js`, `js/impuls.js`, `js/ballistisk.js`, `js/kuler.js` | Fysikk 1: støt mellom vogner, myk landing, ballistisk pendel, kuler i snorer |
| `js/ballstabel.js`, `js/rekyl.js` | Fysikk 1: ballstabel, rekyl |
| `js/usikkerhet.js`, `js/enheter.js`, `js/reaksjon.js` | Fysikk 1: måleusikkerhet, enhetstrener, reaksjonstid (opplegg) |
| `js/bevgraf.js`, `js/frittfall.js`, `js/bremse.js` | Fysikk 1: bevegelsesgrafer, fritt fall, reaksjons- og bremselengde |
| `js/heis.js`, `js/friksjon.js`, `js/luftmotstand.js`, `js/vognlodd.js` | Fysikk 1: heis, friksjon, luftmotstand, vogn og lodd |
| `js/usikkerhet2.js`, `js/linearisering.js` | Fysikk 2: usikkerhet i beregnede størrelser, linearisering |
| `js/skrattkast.js`, `js/skraaplan.js`, `js/snorer.js` | Fysikk 2: skrått kast, skråplan, lodd i to snorer |
| `js/sirkel.js`, `js/dosert.js`, `js/loddrett.js` | Fysikk 2: sirkelbevegelse, dosert sving, loddrett sirkel |
| `js/bakkestot.js` | Fysikk 1: vogn ned bakke og støt |
| `opplegg/`, `js/kraftsensor.js`, `js/eggslipp.js` | Undervisningsopplegg: impuls med kraftsensor, eggslippkonkurranse |
| `js/videoanalyse.js` | Videoanalyse: felles verktøy for Tracker-data, resultattabeller og simuleringen «Videoanalyse uten video» |
| `programmering/`, `data/` | Python-øvinger med datafiler |
| `js/myoner.js`, `js/samtidighet.js`, `js/elektron.js`, `js/gps.js` | Fysikk 2: myoner, toget og lynene, elektronet, GPS-klokkene |
| `js/tunnel.js`, `js/romreise.js` | Fysikk 2: tog og tunnel, romreise (lengdekontraksjon) |
| `js/relbev.js` | Fysikk 2: konstant kraft og lysfarten (relativistisk bevegelsesmengde og energi) |
| `js/efelt.js`, `js/laddkule.js`, `js/avboyning.js` | Fysikk 2: elektrisk felt, ladd kule mellom plater, akselerasjon og avbøyning |
| `js/mbane.js`, `js/fartsvelger.js`, `js/stromhuske.js`, `js/ledere.js` | Fysikk 2: ladd partikkel i magnetfelt, fartsvelger, strømhuske, magnetfelt rundt ledere |
| `js/pingpong.js`, `js/syklotron.js` | Fysikk 2: elektrostatisk ping-pong, syklotron |
| `js/mobilfelt.js` | Opplegg: magnetfelt rundt en leder målt med mobilen |
| `js/pykjorer.js`, `js/pyarbeider.js`, `js/vendor/codemirror/` | Kjørbare Python-bokser på programmeringssidene (Pyodide i en Web Worker, CodeMirror 5 som editor, MIT-lisens) |
| `jupyter/`, `jupyterlite/` | JupyterLite: Jupyter i nettleseren. `jupyter/` er den ferdige appen, `jupyterlite/` har notatbøkene og byggeoppskriften |
| `elevark/` | Elevark som PDF (uten fasit), laget med LaTeX fra oppgavene på sidene |
| `CNAME` | Domenet for GitHub Pages |

## Python i nettleseren

Kodeblokker blir kjørbare når de pakkes inn slik, og siden laster `js/pykjorer.js` (se `programmering/python-horisontalt-kast.html`):

```html
<div class="tekst opplegg py-side" data-filnavn="navn.py" data-filer="../data/sprettball.csv">
  <div class="py-boks" data-navn="Steg 1"><pre class="kode"><code>...</code></pre></div>
</div>
```

Boksene deler variabler som cellene i Jupyter. Python (Pyodide) lastes fra jsDelivr første gang en elev trykker Kjør. JupyterLite bruker samme Pyodide-versjon, slik at nedlastingen deles. Se `jupyterlite/README.md` for hvordan notatbøker legges til.

## Elevark

Oppgavene på hver side finnes også som PDF i `elevark/<mappe>/<side>.pdf`, uten løsningsforslag. Når oppgavene på en side endres, lag arkene på nytt fra mappa `lektorbo.no`:

```
python3 elevark/lag_elevark.py              # alle sidene (ca. 2 minutter)
python3 elevark/lag_elevark.py sim/heis     # bare én side
```

Skriptet krever lualatex (TeX Live). Det leser oppgavene fra HTML-en, gjør formler om til LaTeX og legger inn knappen «Last ned elevark (PDF)» på siden. Oppsettet (skrift, farger, svarplass) står i `elevark/tex/elevark.sty`. Formler som ikke blir riktige automatisk, rettes i `RETTELSER` nederst i skriptet. `.tex`-filene i `elevark/tex/` blir overskrevet hver gang.

Tekst som må fylles inn er merket med klassen `fyll-inn`. Søk etter den før publisering.
