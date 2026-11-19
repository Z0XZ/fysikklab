// Kjører Python i nettleseren med Pyodide, i en egen tråd (Web Worker), slik at siden ikke fryser.
// Brukes av js/pykjorer.js. Alle kodeboksene på en side deler de samme variablene, som i Jupyter.
// Pyodide (CPython kompilert til WebAssembly) lastes fra jsDelivr første gang en elev trykker Kjør.

// Startes som modul-worker: new Worker("pyarbeider.js", { type: "module" }). Samme Pyodide-versjon som JupyterLite i /jupyter/.
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.mjs";
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/";

let py, rom, hjelp;
const klar = (async () => {
  py = await loadPyodide({ indexURL: PYODIDE });
  py.setStdout({ batched: (t) => postMessage({ type: "ut", tekst: t + "\n" }) });
  py.setStderr({ batched: (t) => postMessage({ type: "feilut", tekst: t + "\n" }) });
  hjelp = py.globals.get("dict")();
  py.runPython(`
import os, warnings
os.environ["MPLBACKEND"] = "Agg"   # tegn figurer som bilder, uten vindu
warnings.filterwarnings("ignore", message=r".*(non-GUI backend|non-interactive).*")

def figurer():
    import sys
    if "matplotlib.pyplot" not in sys.modules:
        return []
    import io, base64
    import matplotlib.pyplot as plt
    bilder = []
    for n in plt.get_fignums():
        b = io.BytesIO()
        plt.figure(n).savefig(b, format="png", dpi=110, bbox_inches="tight")
        bilder.append(base64.b64encode(b.getvalue()).decode())
    plt.close("all")
    return bilder
`, { globals: hjelp });
  nyttRom();
})();

function nyttRom() { if (rom) rom.destroy(); rom = py.globals.get("dict")(); }

// Rydder feilmeldingen: Fjerner linjene fra Pyodide selv og fra andre filer enn elevens kode, og skriver «Linje 3» i stedet for «File "<exec>", line 3».
function ryddFeil(tekst) {
  const linjer = tekst.trim().split("\n");
  const start = linjer.findIndex((l) => l.includes('File "<exec>"'));
  const del = start >= 0 ? linjer.slice(start) : linjer.slice(-1);
  // Hopp over linjene fra andre filer (for eksempel robot.py eller pakker), så eleven bare ser sin egen kode og selve feilen
  const ut = [];
  let hopp = false;
  for (const l of del) {
    if (/^\s*File "/.test(l)) hopp = !l.includes('File "<exec>"');
    else if (!/^\s/.test(l)) hopp = false;
    if (!hopp) ut.push(l);
  }
  return ut.map((l) => l.replace(/File "<exec>", line (\d+), in <module>/, "Linje $1").replace(/File "<exec>", line (\d+)/, "Linje $1")).join("\n");
}

onmessage = async (e) => {
  const m = e.data;
  try {
    await klar;
    if (m.type === "nullstill") { nyttRom(); postMessage({ id: m.id, type: "ferdig", ok: true }); return; }
    for (const f of m.filer || []) {
      py.FS.writeFile(f.navn, new Uint8Array(f.data));
      // Hjelpemoduler (for eksempel robot.py) kan importere pakker som matplotlib. Last dem også.
      if (f.navn.endsWith(".py")) await py.loadPackagesFromImports(new TextDecoder().decode(f.data), { messageCallback: () => {}, errorCallback: () => {} });
    }
    await py.loadPackagesFromImports(m.kode, { messageCallback: () => {}, errorCallback: () => {} });
    const t0 = performance.now();
    await py.runPythonAsync(m.kode, { globals: rom });
    const bilder = hjelp.get("figurer")().toJs();
    for (const b of bilder) postMessage({ type: "bilde", png: b });
    postMessage({ id: m.id, type: "ferdig", ok: true, tid: performance.now() - t0 });
  } catch (err) {
    let bilder = [];
    try { bilder = hjelp.get("figurer")().toJs(); } catch { /* ingen figurer */ }
    for (const b of bilder) postMessage({ type: "bilde", png: b });
    postMessage({ id: m.id, type: "ferdig", ok: false, feil: ryddFeil(String(err && err.message || err)) });
  }
};
