# Tekster til det interaktive periodesystemet i formelsamlingen: hva grunnstoffet brukes til i fysikken.
# Tall som masser og halveringstider hentes fra kjernedata.py. Her står bare tekst. Formler kan skrives mellom $ og $.
# Løsrivningsarbeid (eV) er fra CRC Handbook of Chemistry and Physics, slik tabellen gjengis på Wikipedia («Work function»).

KATEGORI = {
    "alkali": ("Alkalimetall", [3, 11, 19, 37, 55, 87]),
    "jordalkali": ("Jordalkalimetall", [4, 12, 20, 38, 56, 88]),
    "overgang": ("Overgangsmetall", list(range(21, 31)) + list(range(39, 49)) + list(range(72, 81)) + list(range(104, 113))),
    "lantanoid": ("Lantanoid", list(range(57, 72))),
    "aktinoid": ("Aktinoid", list(range(89, 104))),
    "metall": ("Annet metall", [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116]),
    "halvmetall": ("Halvmetall", [5, 14, 32, 33, 51, 52]),
    "ikkemetall": ("Ikke-metall", [1, 6, 7, 8, 15, 16, 34]),
    "halogen": ("Halogen", [9, 17, 35, 53, 85, 117]),
    "edelgass": ("Edelgass", [2, 10, 18, 36, 54, 86, 118]),
}

LOSRIVNING = {  # eV
    "Cs": "1,95", "Rb": "2,26", "K": "2,29", "Ba": "2,52–2,70", "Na": "2,75", "Ca": "2,87", "Li": "2,9",
    "Mg": "3,66", "Zn": "3,63–4,9", "Al": "4,06–4,26", "Ag": "4,26–4,74", "W": "4,32–4,55", "Cu": "4,53–5,10",
    "Fe": "4,67–4,81", "Ni": "5,04–5,35", "Au": "5,10–5,47", "Pt": "5,12–5,93", "Sn": "4,42", "Pb": "4,25",
    "Ti": "4,33", "Cr": "4,5", "Co": "5", "Hg": "4,475", "Si": "4,60–4,85", "C": "ca. 5", "Be": "4,98",
}

FYSIKK = {
    1: "Det enkleste atomet: ett proton og ett elektron. Bohrs atommodell forklarer spektrallinjene til hydrogen, for eksempel den røde linjen på 656 nm i Balmer-serien. "
       "I sola fusjonerer hydrogen til helium. Isotopene deuterium (²H) og tritium (³H) er brenselet i fusjonsreaktorer: ²H + ³H → ⁴He + n frigjør 17,6 MeV.",
    2: "En alfapartikkel er en heliumkjerne (⁴He). Helium ble oppdaget i spekteret fra sola i 1868, før det ble funnet på jorda. "
       "Flytende helium (4,2 K) brukes til å kjøle superledende magneter, for eksempel i MR-maskiner.",
    3: "Brukes i litiumionbatterier. ⁶Li kan fange et nøytron og lage tritium, som trengs i fusjonsreaktorer.",
    4: "Chadwick oppdaget nøytronet i 1932 ved å skyte alfapartikler mot beryllium. Brukes fortsatt i nøytronkilder og som nøytronreflektor.",
    5: "¹⁰B fanger nøytroner svært godt og brukes i kontrollstaver i kjernereaktorer.",
    6: "Atommasseenheten er definert ut fra karbon: 1 u er 1/12 av massen til et ¹²C-atom. "
       "¹⁴C dannes i atmosfæren og brukes til å datere organisk materiale (halveringstid om lag 5700 år). Grafitt ble brukt som moderator i den første kjernereaktoren i 1942.",
    7: "Om lag 78 % av lufta. Nøytroner fra kosmisk stråling gjør ¹⁴N om til ¹⁴C. Nitrogen gir det fiolette og blå lyset nederst i nordlyset.",
    8: "Om lag 21 % av lufta. Oksygenatomer gir det grønne (558 nm) og det røde nordlyset. Ozon (O₃) i stratosfæren absorberer UV-stråling.",
    9: "¹⁸F sender ut positroner og brukes i PET-skanning. Halveringstiden er under to timer, så det må lages nær sykehuset.",
    10: "Neonrør er gassutladningsrør med røde spektrallinjer. Helium-neon-laseren gir rødt lys med bølgelengde 633 nm.",
    11: "Natriumdamp gir den gule dobbeltlinjen ved 589 nm, kjent fra gamle gatelys. Lavt løsrivningsarbeid gjør natrium nyttig i forsøk med fotoelektrisk effekt.",
    13: "Lett og god leder, derfor brukt i kraftledninger.",
    14: "Halvleder. Grunnlaget for solceller, dioder og databrikker.",
    15: "³²P er en betastråler som brukes i medisin og biologisk forskning.",
    18: "Om lag 0,93 % av lufta. ⁴⁰Ar dannes når ⁴⁰K henfaller, og forholdet mellom dem brukes til å datere bergarter (kalium-argon-datering).",
    19: "Kroppen inneholder radioaktivt ⁴⁰K, som gir en liten del av stråledosen vi får hvert år. Lavt løsrivningsarbeid gjør kalium aktuelt i fotoceller.",
    26: "⁵⁶Fe har nesten størst bindingsenergi per nukleon. Fusjon i stjerner kan derfor ikke gi energi utover jern. "
        "Jern er ferromagnetisk og brukes som kjerne i transformatorer og elektromagneter. Jordas kjerne er for det meste jern og nikkel.",
    27: "⁶⁰Co sender ut gammastråling og brukes i strålebehandling og til sterilisering av medisinsk utstyr.",
    28: "⁶²Ni er kjernen med størst bindingsenergi per nukleon.",
    29: "Brukes i ledninger fordi resistiviteten er lav, 1,7 · 10⁻⁸ Ω m.",
    31: "Galliumnitrid (GaN) brukes i blå lysdioder, og galliumarsenid i lasere og solceller.",
    32: "Halvleder. Germaniumdetektorer måler energien til gammastråling svært nøyaktig.",
    36: "⁸⁹Kr og ⁹²Kr er vanlige fisjonsprodukter. Fra 1960 til 1983 var meteren definert ut fra en spektrallinje fra ⁸⁶Kr.",
    37: "Brukes i atomur, blant annet i GPS-satellitter.",
    38: "⁹⁰Sr er et fisjonsprodukt som tas opp i skjelettet som kalsium.",
    43: "Det første grunnstoffet som ble laget kunstig (1937). Den metastabile ⁹⁹ᵐTc, med halveringstid 6 timer, er den mest brukte isotopen i nukleærmedisin.",
    47: "Det metallet som leder strøm best.",
    53: "¹³¹I er et fisjonsprodukt som samles i skjoldbruskkjertelen. Jodtabletter fyller kjertelen med stabilt jod, så den tar opp mindre radioaktivt jod.",
    55: "Sekundet er definert ut fra ¹³³Cs: 1 s er 9 192 631 770 svingninger i strålingen fra en bestemt overgang. "
        "¹³⁷Cs fra Tsjernobyl-ulykken i 1986 kan fortsatt måles i Norge. Cesium har lavest løsrivningsarbeid av grunnstoffene.",
    56: "Hahn og Strassmann fant barium etter å ha bestrålt uran med nøytroner (1938). Det var beviset for fisjon. ¹⁴¹Ba og ¹⁴⁴Ba er vanlige fisjonsprodukter.",
    74: "Har det høyeste smeltepunktet av metallene (3422 °C). Brukt i glødetråder og som anode i røntgenrør.",
    79: "Geiger og Marsden skjøt alfapartikler mot tynn gullfolie (1909). Rutherford forklarte resultatet med at atomet har en liten, tung kjerne.",
    80: "Franck–Hertz-forsøket (1914) med kvikksølvdamp viste at atomer har bestemte energinivåer. Kamerlingh Onnes oppdaget superledning i kvikksølv i 1911.",
    82: "Brukes til skjerming mot gamma- og røntgenstråling. ²⁰⁶Pb, ²⁰⁷Pb og ²⁰⁸Pb er de stabile sluttproduktene i henfallsseriene til uran og thorium.",
    83: "²⁰⁹Bi ble lenge regnet som stabil, men henfaller med en halveringstid som er mer enn en milliard ganger universets alder.",
    84: "Oppdaget av Marie og Pierre Curie i 1898. ²¹⁰Po er en kraftig alfastråler.",
    86: "²²²Rn siver opp fra berggrunnen. Radon i inneluft er den største kilden til stråledosen nordmenn får.",
    88: "Oppdaget av Marie og Pierre Curie i 1898. ²²⁶Ra er med i henfallsserien til ²³⁸U. Den gamle enheten curie var aktiviteten til 1 g radium.",
    90: "²³²Th starter thoriumserien. Kan brukes som brensel i kjernereaktorer, og det finnes mye thorium i Norge.",
    92: "Becquerel oppdaget radioaktivitet med uransalter i 1896. ²³⁵U kan spaltes av langsomme nøytroner og brukes i kjernekraftverk. "
        "Med halveringstider på milliarder av år brukes uran også til å datere bergarter.",
    94: "²³⁹Pu dannes når ²³⁸U fanger et nøytron. ²³⁸Pu gir strøm og varme til romsonder som Voyager og Mars-roveren Curiosity.",
    95: "²⁴¹Am er alfakilden i mange røykvarslere.",
}
