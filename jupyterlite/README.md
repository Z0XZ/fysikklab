# JupyterLite for lektorbo.no

Jupyter som kjører helt i nettleseren (Python via Pyodide). Den ferdige appen ligger i `../jupyter/` og publiseres sammen med resten av nettsiden.

Notatbøkene ligger i `innhold/`. Alt som legges der, blir tilgjengelig i JupyterLite. Lenk til en notatbok slik:

    ../jupyter/notebooks/index.html?path=sirkelbevegelse.ipynb

## Lage en notatbok fra en programmeringsside

Sider med kjørbare Python-bokser kan gjøres om til notatbøker automatisk. Tekstene blir markdown, kodeboksene blir kodeceller, og datafilene kopieres med:

    python3 jupyterlite/lag_notatbok.py programmering/python-vognstot.html

Legg så til `data-notatbok="../jupyter/notebooks/index.html?path=vognstot.ipynb"` på `py-side`-elementet på siden, så får panelet en knapp til notatboken. `sirkelbevegelse.ipynb` er laget for hånd og skal ikke lages på nytt med skriptet.

## Bygge på nytt

Etter at du har endret eller lagt til notatbøker:

    python3 -m venv ~/jlvenv
    ~/jlvenv/bin/pip install jupyterlite-core==0.8.7 jupyterlite-pyodide-kernel==0.8.7 jupyter-server
    cd jupyterlite
    ~/jlvenv/bin/jupyter lite build

Merk: Elever som allerede har åpnet en notatbok, ser sin egen lagrede kopi og ikke den nye versjonen. De kan hente den nye ved å slette notatboken i filoversikten og laste siden på nytt.
