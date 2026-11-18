// Kjørbare Python-bokser på programmeringssidene.
// Bruk i HTML:
//   <div class="py-side" data-filnavn="horisontalt_kast.py" data-filer="../data/sprettball.csv"> ... </div>
//   <div class="py-boks" data-navn="Steg 1"><pre class="kode"><code>...</code></pre></div>
// Uten JavaScript vises koden som vanlig. Med JavaScript blir den redigerbar og kjørbar.
// Alle boksene deler variabler, som cellene i Jupyter. Kjører du steg 2 før steg 1, kjøres steg 1 først.
// Elevens endringer lagres i nettleseren (localStorage) og kan tilbakestilles.

(function () {
  const sider = document.querySelectorAll(".py-side");
  if (!sider.length) return;
  const ARBEIDER = new URL("pyarbeider.js", document.currentScript.src).href;
  const harCM = typeof window.CodeMirror === "function";
  const bokser = [];
  let arbeider = null, startet = false, nesteId = 1, pågår = null, kø = Promise.resolve();
  const vent = new Map();
  const side = sider[0];
  const filer = (side.dataset.filer || "").split(",").map((s) => s.trim()).filter(Boolean);

  const lagreNøkkel = (i) => "py:" + location.pathname + ":" + i;
  const hent = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lagre = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ikke lagret */ } };
  const lag = (tag, kl, tekst) => { const e = document.createElement(tag); if (kl) e.className = kl; if (tekst) e.textContent = tekst; return e; };
  const sek = (ms) => (ms / 1000).toFixed(ms < 10000 ? 2 : 1).replace(".", ",") + " s";

  // ---------- Kontrollpanel øverst ----------
  const panel = lag("div", "py-panel");
  const panelTekst = lag("p", "py-panel-tekst");
  panelTekst.innerHTML = "Du kan endre og kjøre koden rett i nettleseren. Trykk <strong>Kjør</strong> eller <kbd>Shift</kbd> + <kbd>Enter</kbd>. Første gang lastes Python ned (omtrent 20–30 MB fra jsDelivr), og det kan ta et halvt minutt. Endringene dine lagres i denne nettleseren.";
  const panelKnapper = lag("div", "py-panel-knapper");
  const lastNed = lag("button", "knapp lys", "Last ned koden (.py)");
  const omstart = lag("button", "knapp lys", "Start Python på nytt");
  lastNed.type = omstart.type = "button";
  const panelStatus = lag("span", "py-status", "Python er ikke startet.");
  panelStatus.setAttribute("aria-live", "polite");
  panelKnapper.append(lastNed, omstart, panelStatus);
  panel.append(panelTekst, panelKnapper);
  side.insertBefore(panel, side.firstChild);

  // ---------- Arbeideren ----------
  function startArbeider() {
    if (arbeider) return;
    arbeider = new Worker(ARBEIDER, { type: "module" });
    startet = false;
    panelStatus.textContent = "Starter Python …";
    arbeider.onmessage = (e) => {
      const m = e.data;
      if (m.type === "ut" || m.type === "feilut") { if (pågår) pågår.skriv(m.tekst, m.type === "feilut"); return; }
      if (m.type === "bilde") { if (pågår) pågår.bilde(m.png); return; }
      if (m.type === "ferdig") { const f = vent.get(m.id); vent.delete(m.id); if (f) f(m); }
    };
    arbeider.onerror = (e) => {
      e.preventDefault();
      for (const [id, f] of vent) { vent.delete(id); f({ ok: false, feil: "Klarte ikke å starte Python. Sjekk at du er koblet til nettet, og prøv igjen." }); }
      stoppArbeider("Python kunne ikke startes.");
    };
  }
  function stoppArbeider(tekst) {
    if (arbeider) arbeider.terminate();
    arbeider = null; startet = false;
    bokser.forEach((b) => { b.kjørt = false; b.settKjører(false); });
    for (const [id, f] of vent) { vent.delete(id); f({ ok: false, stoppet: true }); }
    panelStatus.textContent = tekst;
  }
  async function send(melding) {
    startArbeider();
    const id = nesteId++;
    const svar = new Promise((r) => vent.set(id, r));
    if (!startet) {
      const data = [];
      for (const f of filer) {
        try { const r = await fetch(f); if (r.ok) data.push({ navn: f.split("/").pop(), data: await r.arrayBuffer() }); }
        catch { /* filen mangler */ }
      }
      melding.filer = data;
    }
    arbeider.postMessage({ ...melding, id });
    const m = await svar;
    if (!m.stoppet) { startet = true; }
    return m;
  }

  // ---------- Én boks ----------
  function lagBoks(el, i) {
    const pre = el.querySelector("pre");
    const original = pre.textContent.replace(/\n$/, "");
    const navn = el.dataset.navn || "Kode " + (i + 1);
    const lagret = hent(lagreNøkkel(i));
    const topp = lag("div", "py-topp");
    const tittel = lag("span", "py-navn", navn);
    const endret = lag("span", "py-endret", "endret");
    topp.append(tittel, endret);
    const knapper = lag("div", "py-knapper");
    const kjør = lag("button", "knapp", "Kjør");
    const stopp = lag("button", "knapp lys", "Stopp");
    const tilbake = lag("button", "knapp lys", "Tilbakestill");
    kjør.type = stopp.type = tilbake.type = "button";
    stopp.hidden = true;
    const status = lag("span", "py-status");
    status.setAttribute("aria-live", "polite");
    knapper.append(kjør, stopp, tilbake, status);
    const ut = lag("div", "py-ut");
    ut.hidden = true;
    const ramme = lag("div", "py-redigering");
    el.replaceChildren(topp, ramme, knapper, ut);

    let editor, hentKode, settKode;
    if (harCM) {
      editor = window.CodeMirror(ramme, {
        value: lagret ?? original, mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4,
        matchBrackets: true, viewportMargin: Infinity, lineWrapping: true,
        extraKeys: {
          "Shift-Enter": () => b.kjør(), "Ctrl-Enter": () => b.kjør(), "Cmd-Enter": () => b.kjør(),
          Tab: (cm) => cm.somethingSelected() ? cm.execCommand("indentMore") : cm.replaceSelection("    "),
          "Shift-Tab": "indentLess",
        },
      });
      editor.getWrapperElement().setAttribute("aria-label", "Pythonkode, " + navn);
      hentKode = () => editor.getValue();
      settKode = (k) => editor.setValue(k);
      editor.on("change", () => endring());
    } else {
      const ta = lag("textarea", "py-tekstfelt");
      ta.value = lagret ?? original; ta.spellcheck = false; ta.setAttribute("aria-label", "Pythonkode, " + navn);
      ta.rows = Math.max(4, ta.value.split("\n").length + 1);
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) { e.preventDefault(); b.kjør(); }
        if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); endring(); }
      });
      ta.addEventListener("input", () => endring());
      ramme.append(ta);
      hentKode = () => ta.value;
      settKode = (k) => { ta.value = k; };
    }
    function endring() {
      const k = hentKode();
      lagre(lagreNøkkel(i), k === original ? null : k);
      endret.hidden = k === original;
      b.kjørt = false;
    }
    endret.hidden = (lagret ?? original) === original;

    const b = {
      el, navn, kjørt: false, hentKode,
      settKjører(på) { kjør.disabled = på; stopp.hidden = !på; },
      tøm() { ut.replaceChildren(); ut.hidden = true; },
      skriv(tekst, feil) {
        ut.hidden = false;
        let siste = ut.lastElementChild;
        if (!siste || siste.tagName !== "PRE" || siste.classList.contains("py-feil") !== !!feil) {
          siste = lag("pre", feil ? "py-tekst py-feil" : "py-tekst"); ut.append(siste);
        }
        siste.textContent += tekst;
      },
      bilde(png) {
        ut.hidden = false;
        const img = lag("img", "py-bilde");
        img.src = "data:image/png;base64," + png; img.alt = "Figur laget av koden i " + navn.toLowerCase();
        ut.append(img);
      },
      async kjørEn() {
        b.tøm(); b.settKjører(true);
        status.textContent = startet ? "Kjører …" : "Starter Python …";
        pågår = b;
        const m = await send({ type: "kjor", kode: hentKode() });
        pågår = null; b.settKjører(false);
        if (m.stoppet) { status.textContent = "Stoppet."; return false; }
        panelStatus.textContent = "Python kjører.";
        if (m.ok) { b.kjørt = true; status.textContent = "Ferdig på " + sek(m.tid); if (ut.hidden) { b.skriv("(Ingen utskrift)\n"); } return true; }
        b.skriv(m.feil + "\n", true);
        if (/NameError/.test(m.feil)) b.skriv("Tips: Har du skrevet navnet riktig? Variabler fra stegene over finnes bare hvis de stegene er kjørt.\n", true);
        status.textContent = "Feil i koden.";
        return false;
      },
      kjør() {
        kø = kø.then(async () => {
          const nr = bokser.indexOf(b);
          for (const tidligere of bokser.slice(0, nr)) if (!tidligere.kjørt && !(await tidligere.kjørEn())) return;
          await b.kjørEn();
        });
        return kø;
      },
    };
    kjør.addEventListener("click", () => b.kjør());
    stopp.addEventListener("click", () => stoppArbeider("Python ble stoppet. Det startes på nytt neste gang du trykker Kjør."));
    tilbake.addEventListener("click", () => { settKode(original); endring(); b.tøm(); status.textContent = ""; });
    return b;
  }

  side.querySelectorAll(".py-boks").forEach((el, i) => bokser.push(lagBoks(el, i)));

  lastNed.addEventListener("click", () => {
    const tekst = bokser.map((b) => "# ---- " + b.navn + " ----\n" + b.hentKode()).join("\n\n") + "\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([tekst], { type: "text/x-python" }));
    a.download = side.dataset.filnavn || "kode.py";
    document.body.append(a); a.click(); a.remove();
  });
  omstart.addEventListener("click", () => {
    stoppArbeider("Python er startet på nytt. Alle variabler er slettet.");
    bokser.forEach((b) => b.tøm());
  });
})();
