#!/usr/bin/env python3
"""Lager en Jupyter-notatbok fra en programmeringsside med kjørbare Python-bokser.

Bruk (fra rotmappa, den med index.html):
    python3 jupyterlite/lag_notatbok.py programmering/python-vognstot.html

Notatboken får overskriftene og tekstene fra siden som markdown, og koden fra py-boksene som kodeceller.
Datafilene i data-filer kopieres til innhold/, slik at koden finner dem. Bygg JupyterLite på nytt etterpå.
"""
import html, json, os, re, shutil, sys

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INNHOLD = os.path.join(ROT, "jupyterlite", "innhold")
NETT = "https://fysikklab.no/"

def markdown(h, mappe):
    h = re.sub(r"<code>(.*?)</code>", lambda m: "`" + html.unescape(m.group(1)) + "`", h, flags=re.S)
    h = re.sub(r"<(strong|b)>(.*?)</\1>", r"**\2**", h, flags=re.S)
    h = re.sub(r"<(em|i)>(.*?)</\1>", r"*\2*", h, flags=re.S)
    h = re.sub(r"<sup>(.*?)</sup>", r"<sup>\1</sup>", h)
    def lenke(m):
        href = m.group(1)
        if not href.startswith("http"): href = NETT + os.path.normpath(os.path.join(mappe, href))
        return "[" + m.group(2) + "](" + href + ")"
    h = re.sub(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', lenke, h, flags=re.S)
    h = re.sub(r"<(?!/?su[bp]>)[^>]+>", "", h)
    return html.unescape(re.sub(r"[ \t]+", " ", h)).strip()

def lag(sti):
    s = open(os.path.join(ROT, sti), encoding="utf-8").read()
    mappe = os.path.dirname(sti)
    tittel = markdown(re.search(r"<h1>(.*?)</h1>", s, re.S).group(1), mappe)
    ingress = markdown(re.search(r'<p class="ingress">(.*?)</p>', s, re.S).group(1), mappe)
    m = re.search(r'<div class="tekst opplegg py-side"([^>]*)>(.*?)\n        </div>\n', s, re.S)
    attr, kropp = m.group(1), m.group(2)
    filer = re.search(r'data-filer="([^"]*)"', attr)
    navn = os.path.basename(sti)[len("python-"):-5] + ".ipynb"
    celler = [{"cell_type": "markdown", "metadata": {}, "source": [
        f"# {tittel}\n\n{ingress}\n\n",
        f"Oppgavene står på nettsiden: [{tittel}]({NETT}{sti}). Kjør cellene i rekkefølge med **Shift + Enter**.\n\n",
        "> **Lagring:** Endringene dine lagres bare i denne nettleseren. Vil du ta vare på arbeidet eller levere det, velger du *File → Download*."]}]
    tekst = []
    def tøm():
        if tekst:
            celler.append({"cell_type": "markdown", "metadata": {}, "source": "\n\n".join(tekst)})
            tekst.clear()
    for d in re.finditer(r'<h2>(.*?)</h2>|<h3>(.*?)</h3>|<p>(.*?)</p>|<div class="py-boks"[^>]*><pre class="kode"><code>(.*?)</code></pre></div>', kropp, re.S):
        h2, h3, p, kode = d.groups()
        if h2: tøm(); tekst.append("## " + markdown(h2, mappe))
        elif h3: tøm(); tekst.append("### " + markdown(h3, mappe))
        elif p and 'class="knapp' not in p:
            tekst.append(markdown(p, mappe).replace("Kjør boksen under. ", "").replace("Legg til dette nederst. ", ""))
        elif kode is not None:
            tøm()
            celler.append({"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [],
                           "source": html.unescape(kode).splitlines(True)})
    tøm()
    celler.append({"cell_type": "markdown", "metadata": {}, "source": "## Din egen kode\n\nBruk cellen under til oppgavene. Du kan lage flere celler med **+** i verktøylinja."})
    celler.append({"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": []})
    nb = {"cells": celler, "metadata": {"kernelspec": {"display_name": "Python (Pyodide)", "language": "python", "name": "python"},
          "language_info": {"name": "python"}}, "nbformat": 4, "nbformat_minor": 5}
    os.makedirs(INNHOLD, exist_ok=True)
    json.dump(nb, open(os.path.join(INNHOLD, navn), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if filer:
        for f in filer.group(1).split(","):
            shutil.copy(os.path.normpath(os.path.join(ROT, mappe, f.strip())), INNHOLD)
    print("skrev", navn, "med", sum(c["cell_type"] == "code" for c in celler) - 1, "kodeceller")

for sti in sys.argv[1:]:
    lag(sti)
