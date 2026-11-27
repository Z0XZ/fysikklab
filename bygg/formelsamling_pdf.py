#!/usr/bin/env python3
"""Lager PDF-ene til formelsamlingen med LaTeX (lualatex med Libertinus-skriftene, samme som elevarkene).

Bruk (fra rotmappa, den med index.html):
    python3 bygg/formelsamling_pdf.py          lager opplegg/formelsamling.pdf, -fysikk-1.pdf og -fysikk-2.pdf
    python3 bygg/formelsamling_pdf.py --tex    skriver bare .tex-filene til en midlertidig mappe og viser hvor

Innholdet står i bygg/formelsamling.py, det samme som nettsiden bygges fra.
"""
import os, shutil, subprocess, sys, tempfile
HER = os.path.dirname(os.path.abspath(__file__))
ROT = os.path.dirname(HER)
sys.path.insert(0, HER)
import formelsamling as fs

UTVALG = {"alle": fs.FIL, "f1": fs.FIL + "-fysikk-1", "f2": fs.FIL + "-fysikk-2"}

def main():
    tmp = tempfile.mkdtemp()
    for utvalg, navn in UTVALG.items():
        tex = os.path.join(tmp, navn + ".tex")
        open(tex, "w", encoding="utf-8").write(fs.tex(utvalg))
        if "--tex" in sys.argv: continue
        r = subprocess.run(["lualatex", "-interaction=nonstopmode", "-halt-on-error", navn + ".tex"], cwd=tmp, capture_output=True, text=True)
        if r.returncode:
            print(r.stdout[-3000:]); sys.exit(f"lualatex feilet for {navn}.tex (ligger i {tmp})")
        logg = open(os.path.join(tmp, navn + ".log"), encoding="utf-8", errors="replace").read()
        for linje in logg.splitlines():
            if "Missing character" in linje or "Overfull \\hbox" in linje: print("  ", navn, linje.strip())
        shutil.copy(os.path.join(tmp, navn + ".pdf"), os.path.join(ROT, "opplegg", navn + ".pdf"))
        print("skrev opplegg/" + navn + ".pdf")
    if "--tex" in sys.argv: print("tex-filene ligger i", tmp)

if __name__ == "__main__":
    main()
