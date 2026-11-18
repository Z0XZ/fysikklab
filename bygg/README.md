# Bygging av sider

Noen av sidene på lektorbo.no lages fra kildefiler i denne mappa. Rediger kildene her, ikke de ferdige sidene. Ellers blir endringene borte neste gang sidene bygges.

```
python3 bygg/bygg.py --sjekk     # vis hvilke sider som ville blitt endret, uten å skrive noe
python3 bygg/bygg.py             # bygg alle sidene
python3 bygg/bygg.py opplegg/heis-mobil programmering/python-rakett   # bygg bare disse
```

Kjør `--sjekk` først. Hvis den viser endringer du ikke har gjort i kildene, er den ferdige siden redigert direkte. Flytt i så fall endringen inn i kilden før du bygger.

## Hva som bygges

| Kilde | Sider |
|---|---|
| `kilder/opplegg/*.html` | Forsøkene: sentripetalakselerasjon og heis med mobilen, e/m, videoanalyse av skrått kast |
| `kilder/sim/*.html` | Simuleringene e/m for elektronet og Millikans oljedråpeforsøk |
| `kilder/programmering/*.html` og `kilder/py/*.py` | Programmeringssidene grunnkurs, regresjon, satellittbane, elektrisk felt, energi med friksjon, rakett, Monte Carlo og Biot–Savart. `@@fil.py@@` i kilden byttes med koden i `kilder/py/`. |
| `begrep.py` | Begrepstestene `opplegg/begrep-*.html`. Spørsmålene står i skriptet. Alternativene stokkes, men i samme rekkefølge hver gang. |
| `repetisjon.py` | Repetisjonssidene `opplegg/repetisjon-*.html` |
| `kompetansemaal.py` | Lærersiden `opplegg/kompetansemaal.html`. Bygges sist, fordi den henter titlene fra de andre sidene. Legg nye sider inn i listene `F1` og `F2`. |

De andre sidene på lektorbo.no er ikke med her og redigeres direkte.

## Kildeformatet

En kildefil har et lite hode, en linje med `---` og så innholdet (se `lag_side.py`):

```
tittel: Heisen med mobilen – lektorbo.no
beskrivelse: Én setning til søkemotorer.
fagside: undervisningsopplegg.html
fag: Undervisningsopplegg
tema: Fysikk 1 · Krefter
script: maaletabell.js,heismobil.js
meny: undervisningsopplegg.html
---
<h1>…</h1>
```

`script` er en kommaseparert liste med filer i `js/`, og `felles.js` lastes alltid først. `-` betyr ingen skript.

## Etter byggingen

- **Python-bokser:** Kodeblokkene på programmeringssidene blir kjørbare Python-bokser. Innstillingene står i `PY_SIDER` i `bygg.py`: filnavn for nedlasting, datafiler, notatbok og hvilke bokser som er et nytt, selvstendig program (`ny`).
- **Elevark:** Knappen «Last ned elevark (PDF)» settes inn hvis PDF-en finnes. PDF-ene lages med `python3 elevark/lag_elevark.py opplegg/heis-mobil …`.
- **Notatbøker:** De lages med `python3 jupyterlite/lag_notatbok.py programmering/python-rakett.html`, og så bygges JupyterLite på nytt (se `jupyterlite/README.md`).
- **Kort:** Kortene på oversiktssidene ble satt inn med `kort.py`. Det er ikke en del av byggingen. Skriptet hopper over kort som allerede finnes, så det kan brukes som mal for nye kort.

Test alltid sidene i nettleseren etterpå, og sjekk tall i nye fasiter med Python.
