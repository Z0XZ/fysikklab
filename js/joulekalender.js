// Joulekalenderen: påmelding, lukene, innlevering av svar og poengtavlen. Serverkallene ligger i jk-api.js.
(function () {
  const app = document.getElementById("jk-app");
  if (!app) return;
  const $ = (id) => document.getElementById(id);
  const TEST = new URLSearchParams(location.search).has("test");
  const FAGNAVN = { F1: "Fysikk 1", F2: "Fysikk 2", TEST: "Test" };
  const BOKST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const lagre = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* privat vindu */ } };
  const hent = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  let klasser = [];                  // alle klassene som er logget inn i denne nettleseren: { kode, fag, lagnavn, skole }
  let valgt = {};                    // fag → koden til klassen som leverer i det faget (når det er flere)
  // Skole, navn og e-post fra forrige påmelding, så de slipper å skrives på nytt
  let forrige = {};
  try { forrige = JSON.parse(hent("jk-laerer") || "{}"); } catch (e) { forrige = {}; }
  let fag = hent("jk-fag") || "F1";
  const iFag = () => klasser.filter((k) => k.fag === fag);
  const klasse = () => { const k = iFag(); return k.find((x) => x.kode === valgt[fag]) || k[0] || null; };
  function lagreKlasser() { lagre("jk-koder", JSON.stringify(klasser.map((k) => k.kode))); lagre("jk-valgt", JSON.stringify(valgt)); }
  function leggTil(k) { klasser = klasser.filter((x) => x.kode !== k.kode).concat(k); valgt[k.fag] = k.kode; lagreKlasser(); }
  let kal = null, aapen = null;      // kalenderdata og nummeret på luka som vises

  // ---------- Tall og datoer ----------
  const datoF = new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "long" });
  const klF = new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });
  const dato = (t) => datoF.format(new Date(t));
  const datoKl = (t) => dato(t) + " kl. " + klF.format(new Date(t)).replace(":", ".");

  function tall(x) {
    if (x == null || !isFinite(x)) return "";
    const a = Math.abs(x);
    if (a !== 0 && (a < 1e-3 || a >= 1e7)) {
      const n = Math.floor(Math.log10(a)), m = x / 10 ** n;
      return tall(Number(m.toPrecision(4))) + "·10<sup>" + String(n).replace("-", "−") + "</sup>";
    }
    return new Intl.NumberFormat("nb-NO", { maximumSignificantDigits: 10 }).format(x).replace("-", "−");
  }
  const poengT = (p) => new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 }).format(p);

  // Leser 3,58 · 3.58 · 86 400 · 3,2e5 · 3,2·10^5 · 3,2*10^-5 · 10^5
  function lesTall(s) {
    const t = s.trim().replace(/[\s  ]/g, "").replace(/[−–]/g, "-").replace(/,/g, ".").replace(/[{}]/g, "");
    if (!t) return null;
    let m = t.match(/^([-+]?(?:\d+\.?\d*|\.\d+))(?:[eE]([-+]?\d+)|[·*×xX⋅]10\^\(?([-+]?\d+)\)?)?$/);
    if (m) return Number(m[1] + "e" + (m[2] ?? m[3] ?? "0"));
    m = t.match(/^([-+]?)10\^\(?([-+]?\d+)\)?$/);
    return m ? Number(m[1] + "1e" + m[2]) : NaN;
  }

  // ---------- Meldinger ----------
  function melding(tekst, type) {
    const m = $("jk-melding");
    m.textContent = tekst; m.className = "jk-melding" + (type ? " " + type : ""); m.hidden = !tekst;
  }

  // ---------- Klassen ----------
  function visKlasse(nyKode) {
    const b = $("jk-klasse");
    const ny = nyKode && klasser.find((k) => k.kode === nyKode);
    const skjema = `
      <div class="jk-to">
        <form id="jk-inn" class="jk-skjema">
          <h2>${klasser.length ? "Logg inn med en kode" : "Har klassen en kode?"}</h2>
          <label>Klassekode <input name="kode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCDE-FGHJK" required></label>
          <button class="knapp" type="submit">Logg inn</button>
        </form>
        <form id="jk-pamelding" class="jk-skjema">
          <h2>${klasser.length ? "Meld på en klasse til" : "Meld på klassen"}</h2>
          <label>Fag <select name="fag" required>
            <option value="F1">Fysikk 1</option><option value="F2">Fysikk 2</option>${TEST ? '<option value="TEST">Test</option>' : ""}
          </select></label>
          <label>Lagnavn (vises på poengtavlen) <input name="lagnavn" maxlength="40" required></label>
          <label>Skole <input name="skole" maxlength="80" autocomplete="organization" required></label>
          <label>Navnet ditt <input name="laerer" maxlength="80" autocomplete="name" required></label>
          <label>E-post <input name="epost" type="email" maxlength="120" autocomplete="email" required></label>
          <label class="jk-avkryss"><input type="checkbox" name="ok" required> Jeg har lest <a href="#personvern">personvernet</a> nederst på siden.</label>
          <button class="knapp" type="submit">Meld på</button>
        </form>
      </div>`;
    b.innerHTML = `
      ${ny ? `<div class="jk-ny-kode"><p>${esc(ny.lagnavn)} er påmeldt i ${FAGNAVN[ny.fag]}. Klassekoden er</p><p class="jk-kode">${esc(ny.kode)}</p>
        <p>Skriv ned koden. Du trenger den for å levere svar fra en annen datamaskin eller nettleser. Den er lagret i denne nettleseren.</p></div>` : ""}
      ${klasser.length ? `<div class="jk-innlogget"><h2>Klassene dine</h2><ul>${klasser.map((k) => `<li>
        <span><strong>${esc(k.lagnavn)}</strong> · ${esc(k.skole)} · ${FAGNAVN[k.fag]}</span>
        <span class="jk-dempet">Kode <code>${esc(k.kode)}</code></span>
        <button type="button" class="knapp lys liten" data-ut="${esc(k.kode)}" aria-label="Logg ut ${esc(k.lagnavn)}">Logg ut</button></li>`).join("")}</ul>
        <details class="jk-flere"><summary>Legg til en klasse til</summary>${skjema}</details></div>` : skjema}`;
    for (const k of b.querySelectorAll("[data-ut]")) k.onclick = () => {
      klasser = klasser.filter((x) => x.kode !== k.dataset.ut); lagreKlasser();
      if (!klasser.length) { forrige = {}; lagre("jk-laerer", null); } visKlasse(); visHvem(); lastKalender();
    };
    const p = $("jk-pamelding");
    p.fag.value = fag in FAGNAVN && (fag !== "TEST" || TEST) ? fag : "F1";
    const sist = klasser[klasser.length - 1] || {};   // klasser logget inn med kode har også navn og e-post
    for (const n of ["skole", "laerer", "epost"]) { const v = forrige[n] || sist[n]; if (v) p[n].value = v; }
    const ferdig = (k, nyKode) => { leggTil(k); visKlasse(nyKode); melding(""); velgFag(k.fag); };
    $("jk-inn").onsubmit = async (e) => {
      e.preventDefault();
      const knapp = e.target.querySelector("button");
      knapp.disabled = true;
      try { ferdig(await JK_API.klasse(e.target.kode.value)); }
      catch (err) { melding(err.message, "feil"); knapp.disabled = false; }
    };
    p.onsubmit = async (e) => {
      e.preventDefault();
      const knapp = p.querySelector("button[type=submit]");
      knapp.disabled = true;
      try {
        const k = await JK_API.meldPa({ fag: p.fag.value, lagnavn: p.lagnavn.value, skole: p.skole.value, laerer: p.laerer.value, epost: p.epost.value });
        forrige = { skole: p.skole.value.trim(), laerer: p.laerer.value.trim(), epost: p.epost.value.trim() };
        lagre("jk-laerer", JSON.stringify(forrige));
        ferdig(k, k.kode);
      } catch (err) { melding(err.message, "feil"); knapp.disabled = false; }
    };
  }

  // Har du flere klasser i samme fag, velger du her hvem som leverer
  function visHvem() {
    const ut = $("jk-hvem"), k = iFag();
    if (k.length < 2) { ut.hidden = true; ut.innerHTML = ""; return; }
    ut.hidden = false;
    ut.innerHTML = `<label>Klasse <select>${k.map((x) => `<option value="${esc(x.kode)}"${x === klasse() ? " selected" : ""}>${esc(x.lagnavn)}</option>`).join("")}</select></label>
      <span class="jk-dempet">Svarene du leverer, gjelder klassen som er valgt her.</span>`;
    ut.querySelector("select").onchange = (e) => { valgt[fag] = e.target.value; lagreKlasser(); melding(""); lastKalender(); };
  }

  // ---------- Faner ----------
  function velgFag(f) {
    fag = f; lagre("jk-fag", f); aapen = null;
    for (const k of app.querySelectorAll("[data-fag]")) k.setAttribute("aria-selected", String(k.dataset.fag === f));
    visHvem(); lastKalender();
  }

  // ---------- Kalenderen ----------
  async function lastKalender() {
    const fagNa = fag;
    $("jk-luker").setAttribute("aria-busy", "true");
    try {
      const [k, t] = await Promise.all([JK_API.kalender(fag, klasse()?.kode), JK_API.poengtavle(fag)]);
      if (fagNa !== fag) return;
      kal = k; visLuker(); visLuke(); visTavle(t);
    } catch (err) { melding(err.message, "feil"); }
    $("jk-luker").removeAttribute("aria-busy");
  }

  function lukeStatus(l) {
    if (l.status === "stengt") return { kl: "stengt", tekst: "Åpner " + dato(l.aapner) };
    const n = l.oppgaver.length, lev = l.oppgaver.filter((o) => o.svar).length;
    if (l.status === "aapen") {
      const merke = klasse() ? (lev === n && n ? "Levert ✓" : lev ? `Levert ${lev} av ${n}` : "Ikke levert") : "";
      return { kl: lev === n && n ? "levert" : "aapen", tekst: "Åpen til " + datoKl(l.frist), merke };
    }
    const sum = l.oppgaver.reduce((s, o) => s + (o.poeng || 0), 0), maks = l.oppgaver.reduce((s, o) => s + Number(o.maks), 0);
    return { kl: "ferdig", tekst: "Fasit er klar", merke: klasse() ? `${poengT(sum)} av ${poengT(maks)} poeng` : "" };
  }

  function visLuker() {
    const ut = $("jk-luker");
    if (!kal.luker.length) { ut.innerHTML = `<p class="jk-dempet">Lukene for ${FAGNAVN[fag]} er ikke lagt inn ennå.</p>`; return; }
    ut.innerHTML = kal.luker.map((l) => {
      const s = lukeStatus(l);
      return `<button type="button" class="jk-rute ${s.kl}${aapen === l.nr ? " valgt" : ""}" data-nr="${l.nr}" ${l.status === "stengt" ? "disabled" : ""}
        aria-pressed="${aapen === l.nr}">
        <span class="jk-nr">${l.nr}</span>
        <span class="jk-tittel">${esc(l.tittel) || (l.status === "stengt" ? "Ikke åpnet" : "Luke " + l.nr)}</span>
        <span class="jk-status">${s.tekst}</span>
        ${s.merke ? `<span class="jk-merke">${s.merke}</span>` : ""}
      </button>`;
    }).join("");
    for (const r of ut.querySelectorAll(".jk-rute")) r.onclick = () => {
      aapen = aapen === Number(r.dataset.nr) ? null : Number(r.dataset.nr);
      visLuker(); visLuke();
      if (aapen) $("jk-luke").scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  // ---------- Én luke ----------
  function svarTekst(o, s) {
    if (!s) return "<em>ikke levert</em>";
    if (o.type === "tall") return tall(s.verdi) + (o.enhet ? " " + esc(o.enhet) : "");
    if (o.type === "flervalg") return s.valgt.length ? s.valgt.slice().sort().join(", ") : "ingen valgt";
    return s.rekkefolge.join(" → ");
  }
  function fasitTekst(o) {
    if (o.type === "tall") return tall(o.fasit.verdi) + (o.enhet ? " " + esc(o.enhet) : "");
    if (o.type === "flervalg") return o.fasit.riktige.join(", ");
    return o.fasit.rekkefolge.join(" → ");
  }

  function delSkjema(o, kanSvare) {
    const dis = kanSvare ? "" : "disabled";
    const s = o.svar;
    if (o.type === "tall") {
      const verdi = s ? (s.tekst || String(s.verdi).replace(".", ",")) : "";
      return `<div class="jk-tallfelt"><input type="text" inputmode="decimal" autocomplete="off" data-id="${o.id}" value="${esc(verdi)}" ${dis}
        aria-label="Svar på del ${o.del}${o.enhet ? " i " + esc(o.enhet) : ""}"> <span>${esc(o.enhet)}</span></div>
        <p class="jk-tolkning" data-for="${o.id}" aria-live="polite"></p>`;
    }
    if (o.type === "flervalg") {
      return `<ul class="jk-valg">${o.alternativer.map((a, i) => `<li><label><input type="checkbox" data-id="${o.id}" value="${BOKST[i]}"
        ${s && s.valgt.includes(BOKST[i]) ? "checked" : ""} ${dis}> <b>${BOKST[i]}</b> ${esc(a)}</label></li>`).join("")}</ul>`;
    }
    const rek = s ? s.rekkefolge : o.alternativer.map((_, i) => BOKST[i]);
    return `<ol class="jk-rangering" data-id="${o.id}">${rek.map((b) => `<li data-b="${b}"><span><b>${b}</b> ${esc(o.alternativer[BOKST.indexOf(b)])}</span>
      <span class="jk-pil"><button type="button" class="knapp lys liten" data-opp ${dis} aria-label="Flytt ${b} opp">↑</button><button type="button" class="knapp lys liten" data-ned ${dis} aria-label="Flytt ${b} ned">↓</button></span></li>`).join("")}</ol>`;
  }

  function visLuke() {
    const ut = $("jk-luke");
    const l = kal && kal.luker.find((x) => x.nr === aapen);
    if (!l || l.status === "stengt") { ut.hidden = true; ut.innerHTML = ""; return; }
    ut.hidden = false;
    const egen = Boolean(klasse()), kanSvare = egen && l.status === "aapen";
    const bilder = l.bilder.map((b, i) => `<a href="${esc(b)}" target="_blank" rel="noopener"><img src="${esc(b)}" alt="Oppgaveteksten til luke ${l.nr}${l.bilder.length > 1 ? ", side " + (i + 1) : ""}" loading="lazy"></a>`).join("");
    let html = `<h2>Luke ${l.nr}${l.tittel ? ": " + esc(l.tittel) : ""}</h2>
      <p class="jk-dempet">${l.status === "aapen" ? "Frist " + datoKl(l.frist) + ". Svaret kan endres fram til fristen." : "Fristen var " + datoKl(l.frist) + "."}</p>
      ${l.innhold ? (l.status === "ferdig" ? `<details class="jk-oppgavetekst"><summary>Vis oppgaveteksten</summary><div class="jk-innhold">${l.innhold}</div></details>` : `<div class="jk-innhold">${l.innhold}</div>`) : ""}
      ${bilder ? `<div class="jk-bilder">${bilder}</div>` : ""}`;
    // innhold er HTML som bare kan skrives i databasen av deg (via Supabase-dashbordet), så den settes inn som den er

    if (l.status === "ferdig") {
      html += `<div class="jk-fasit">${l.oppgaver.map((o) => `<div class="jk-del">
        <h3>Del ${o.del}${o.tekst ? ": " + esc(o.tekst) : ""}</h3>
        <dl><dt>Fasit</dt><dd>${fasitTekst(o)}</dd>
        ${egen ? `<dt>Svaret deres</dt><dd>${svarTekst(o, o.svar)}</dd><dt>Poeng</dt><dd>${poengT(o.poeng || 0)} av ${poengT(o.maks)}</dd>` : ""}</dl>
        ${o.type !== "tall" ? `<ul class="jk-alt">${o.alternativer.map((a, i) => `<li><b>${BOKST[i]}</b> ${esc(a)}</li>`).join("")}</ul>` : ""}
        ${o.forklaring ? `<p class="jk-forklaring">${esc(o.forklaring)}</p>` : ""}</div>`).join("")}</div>`;
      ut.innerHTML = html; return;
    }

    const merk = egen ? "" : !klasser.length ? "Logg inn med klassekoden eller meld på klassen for å levere svar."
      : `Ingen av klassene dine er påmeldt i ${FAGNAVN[fag]}. Meld på en klasse eller logg inn med koden øverst på siden.`;
    html += `<form id="jk-svarskjema" class="jk-svar" novalidate>
      ${merk ? `<p class="jk-merknad">${merk}</p>` : ""}
      ${l.oppgaver.map((o) => `<fieldset class="jk-del"><legend>Del ${o.del}${o.tekst ? ": " + esc(o.tekst) : ""}</legend>
        ${o.type === "flervalg" ? '<p class="jk-dempet">Velg alle som er riktige. Hvert galt valg trekker poeng.</p>' : ""}
        ${o.type === "rangering" ? '<p class="jk-dempet">Flytt alternativene i riktig rekkefølge.</p>' : ""}
        ${delSkjema(o, kanSvare)}
        ${o.levert ? `<p class="jk-levert">Levert ${datoKl(o.levert)}</p>` : ""}</fieldset>`).join("")}
      ${kanSvare ? '<button class="knapp" type="submit">Lever svar</button>' : ""}
    </form>`;
    ut.innerHTML = html;

    const skjema = $("jk-svarskjema");
    for (const inp of skjema.querySelectorAll(".jk-tallfelt input")) {
      const vis = () => {
        const p = skjema.querySelector(`.jk-tolkning[data-for="${inp.dataset.id}"]`), x = lesTall(inp.value);
        p.innerHTML = x === null ? "" : isNaN(x) ? "Skriv bare tallet, for eksempel 3,58 eller 2,4·10^5." : "Leses som " + tall(x);
        p.classList.toggle("feil", x !== null && isNaN(x));
      };
      inp.addEventListener("input", vis); vis();
    }
    for (const ol of skjema.querySelectorAll(".jk-rangering")) ol.addEventListener("click", (e) => {
      const k = e.target.closest("button"); if (!k) return;
      const li = k.closest("li");
      if (k.hasAttribute("data-opp") && li.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling);
      if (k.hasAttribute("data-ned") && li.nextElementSibling) li.parentNode.insertBefore(li.nextElementSibling, li);
      k.focus();
    });
    if (kanSvare) skjema.onsubmit = (e) => { e.preventDefault(); lever(l, skjema); };
  }

  async function lever(l, skjema) {
    const svar = [];
    for (const o of l.oppgaver) {
      if (o.type === "tall") {
        const inp = skjema.querySelector(`.jk-tallfelt input[data-id="${o.id}"]`), x = lesTall(inp.value);
        if (x === null) continue;
        if (isNaN(x)) { melding(`Del ${o.del}: Skriv bare tallet, uten enhet.`, "feil"); inp.focus(); return; }
        svar.push({ oppgave: o.id, svar: { verdi: x, tekst: inp.value.trim() } });
      } else if (o.type === "flervalg") {
        const valgt = [...skjema.querySelectorAll(`input[type=checkbox][data-id="${o.id}"]:checked`)].map((c) => c.value);
        if (valgt.length || o.svar) svar.push({ oppgave: o.id, svar: { valgt } });
      } else {
        svar.push({ oppgave: o.id, svar: { rekkefolge: [...skjema.querySelectorAll(`.jk-rangering[data-id="${o.id}"] li`)].map((li) => li.dataset.b) } });
      }
    }
    if (!svar.length) { melding("Fyll inn minst ett svar før du leverer.", "feil"); return; }
    const knapp = skjema.querySelector("button[type=submit]");
    knapp.disabled = true;
    try {
      const r = await JK_API.sendSvar(klasse().kode, svar);
      melding(`Svaret på luke ${l.nr} er levert (${r.lagret} ${r.lagret === 1 ? "del" : "deler"}). Det siste dere leverer før fristen, er det som teller.`, "ok");
      await lastKalender();
    } catch (err) { melding(err.message, "feil"); knapp.disabled = false; }
  }

  // ---------- Poengtavlen ----------
  function visTavle(t) {
    const ut = $("jk-tavle");
    if (!t.klasser.length) { ut.innerHTML = `<p class="jk-dempet">Ingen klasser er påmeldt i ${FAGNAVN[fag]} ennå.</p>`; return; }
    const nr = kal.luker.map((l) => l.nr);
    let plass = 0, forrige = null;
    const rader = t.klasser.map((k, i) => {
      if (k.sum !== forrige) { plass = i + 1; forrige = k.sum; }
      const egen = iFag().some((x) => x.lagnavn === k.lagnavn);
      const celler = nr.map((n) => k.luker[n] != null ? poengT(k.luker[n]) : k.levert.includes(n) ? '<span title="Levert">✓</span>' : "–");
      return `<tr${egen ? ' class="egen"' : ""}><td>${t.ferdige.length ? plass : ""}</td><th scope="row">${esc(k.lagnavn)}</th><td class="jk-skole">${esc(k.skole)}</td>
        ${celler.map((c) => `<td>${c}</td>`).join("")}<td><strong>${poengT(k.sum)}</strong></td></tr>`;
    }).join("");
    ut.innerHTML = `<p class="jk-dempet">${t.klasser.length} ${t.klasser.length === 1 ? "klasse" : "klasser"} med i ${FAGNAVN[fag]}.
      ${t.ferdige.length ? `Poeng fra ${t.ferdige.length === 1 ? "luke " + t.ferdige[0] : "lukene " + t.ferdige.join(", ")} (maks ${poengT(t.maks)}).` : "Poengene kommer når fristen for de første lukene er ute."}
      ✓ betyr levert.</p>
      <div class="tabell-ramme"><table class="sim-tabell jk-tabell"><thead><tr><th>Plass</th><th>Lag</th><th>Skole</th>
      ${nr.map((n) => `<th>${n}</th>`).join("")}<th>Sum</th></tr></thead><tbody>${rader}</tbody></table></div>`;
  }

  // ---------- Start ----------
  async function start() {
    if (!JK_API.klar) { melding("Joulekalenderen er ikke koblet til serveren ennå.", "feil"); return; }
    const faner = app.querySelector(".jk-faner");
    if (TEST) faner.insertAdjacentHTML("beforeend", '<button type="button" role="tab" data-fag="TEST">Test</button>');
    else if (fag === "TEST") fag = "F1";
    for (const k of app.querySelectorAll("[data-fag]")) k.onclick = () => velgFag(k.dataset.fag);
    // Hent klassene som er lagret i nettleseren. Koder som ikke finnes lenger, fjernes.
    let koder = [];
    try { koder = JSON.parse(hent("jk-koder") || "[]"); valgt = JSON.parse(hent("jk-valgt") || "{}"); } catch (e) { koder = []; }
    if (hent("jk-kode")) { koder.push(hent("jk-kode")); lagre("jk-kode", null); }   // fra da siden bare husket én klasse
    const svar = await Promise.all([...new Set(koder)].map((k) => JK_API.klasse(k).catch((e) => (/Fant ingen/.test(e.message) ? null : (melding(e.message, "feil"), { kode: k, ukjent: true })))));
    klasser = svar.filter((k) => k && !k.ukjent);
    lagre("jk-koder", JSON.stringify(svar.filter(Boolean).map((k) => k.kode)));   // ved nettfeil beholdes koden til neste gang
    if (klasser.length && !klasser.some((k) => k.fag === fag)) fag = klasser[0].fag;
    visKlasse();
    velgFag(fag);
  }
  start();
})();
