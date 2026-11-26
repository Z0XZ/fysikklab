#!/usr/bin/env python3
# Lager en side for fysikklab.no fra en kildefil med et lite hode, skilt fra innholdet med en linje med ---:
#   tittel, beskrivelse, fagside (lenken i brødsmulene), fag, tema, script (kommaseparert, - for ingen) og meny (aktiv side i menyen).
#   Valgfritt: robots (for eksempel noindex, så søkemotorer ikke tar med siden) og bunn (teksten nederst til høyre).
# Brukes av bygg.py, men kan også kjøres alene: python3 bygg/lag_side.py <kildemappe> <utmappe>
import sys, os, html, re

MENY = [("simuleringer.html", "Simuleringer"), ("undervisningsopplegg.html", "Undervisningsopplegg"), ("programmering.html", "Programmering"), ("om-meg.html", "Om meg")]

def lag(tekst):
    hode, kropp = tekst.split("\n---\n", 1)
    f = {}
    for linje in hode.splitlines():
        if ":" in linje:
            k, v = linje.split(":", 1); f[k.strip()] = v.strip()
    meny = f.get("meny", "simuleringer.html")
    menylinjer = "\n".join(f'        <li><a href="../{h}"{" aria-current=\"page\"" if h == meny else ""}>{n}</a></li>' for h, n in MENY)
    # Rykk inn kroppen med 8 mellomrom, men ikke linjer inne i <pre>
    ut, i_pre = [], False
    for linje in kropp.rstrip("\n").split("\n"):
        if i_pre:
            ut.append(linje)
        else:
            ut.append(("        " + linje) if linje.strip() else "")
        if "<pre" in linje and "</pre>" not in linje: i_pre = True
        elif "</pre>" in linje: i_pre = False
    script = f.get("script", "-")
    robots = f'  <meta name="robots" content="{f["robots"]}">\n' if f.get("robots") else ""
    skript = "" if script == "-" else "\n".join(f'  <script src="../js/{n.strip()}"></script>' for n in ["felles.js"] + script.split(","))
    return f"""<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{f['tittel']}</title>
  <meta name="description" content="{html.escape(f['beskrivelse'], quote=True)}">
{robots}  <script src="../js/tema.js"></script>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <a class="hopp" href="#innhold">Hopp til innholdet</a>
  <header class="topp">
    <div class="ramme">
      <a class="logo" href="../index.html">fysikklab<span>.no</span></a>
      <nav aria-label="Hovedmeny"><ul class="meny">
{menylinjer}
      </ul></nav>
      <button id="tema-knapp" class="tema-knapp" type="button" aria-label="Bytt mellom lys og mørk modus">
        <svg class="ikon-sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>
        <svg class="ikon-mane" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>
      </button>
    </div>
  </header>
  <main id="innhold">
    <section class="side sim-side">
      <div class="ramme">
        <p class="brodsmuler"><a href="../{f['fagside']}">{f['fag']}</a> / {f['tema']}</p>
{chr(10).join(ut)}
      </div>
    </section>
  </main>
  <footer class="bunn">
    <div class="ramme">
      <span>© 2026 fysikklab.no</span>
      <span>{f.get("bunn", "Ingen innlogging, informasjonskapsler eller sporing.")}</span>
    </div>
  </footer>
{skript}
</body>
</html>
"""

if __name__ == "__main__":
    inn, utmappe = sys.argv[1], sys.argv[2]
    for navn in sorted(os.listdir(inn)):
        if navn.endswith(".html"):
            open(os.path.join(utmappe, navn), "w", encoding="utf-8").write(lag(open(os.path.join(inn, navn), encoding="utf-8").read()))
            print("skrev", navn)
