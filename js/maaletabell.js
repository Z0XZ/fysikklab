// Felles måletabell for forsøkene: Elevene skriver inn målinger, verktøyet regner ut nye kolonner,
// plotter punktene og tilpasser en rett linje (gjennom origo eller med konstantledd).
// Brukes slik (etter felles.js):
//   Maaletabell({
//     rot: "id-til-beholder", nokkel: "lektorbo-…", csv: "fil.csv",
//     kolonner: [{ k: "w", navn: "ω (rad/s)" }, …],        // kolonnene eleven fyller inn
//     beregnet: ["ω² (rad²/s²)", …],                        // kolonner som regnes ut
//     innstillinger: ["id-til-input", …],                    // andre felt som lagres og gir ny utregning
//     linje: "origo" | "fri" | "ingen" | "punkter",          // "punkter" trekker strek mellom punktene
//     graf: { xTekst, yTekst },
//     analyser(rader, inn) → { celler: [[tekst, …], …], pkt: [{ x, y }] },   // én liste celler per rad
//     resultater(fit, pkt, inn) → { "id": "tekst", … },      // fit = { a, b } for y = a x + b
//     eksempel: { inn: { id: "verdi" }, rader: [{ w: "8,2", … }, …] },
//   })
// Hjelpefunksjonen Maaletabell.tall("2,5") gir 2.5, og null hvis feltet er tomt.

function Maaletabell(o) {
  const $ = Sim.$;
  const rot = $(o.rot);
  if (!rot) return;
  const tall = Maaletabell.tall;
  const tom = () => Object.fromEntries(o.kolonner.map((k) => [k.k, ""]));
  const lagret = Sim.hent(o.nokkel, null);
  let rader = lagret?.rader?.length ? lagret.rader : Array.from({ length: o.startRader || 5 }, tom);
  for (const id of o.innstillinger || []) if (lagret?.inn?.[id] !== undefined && $(id)) $(id).value = lagret.inn[id];

  // Bygg tabellen
  const ramme = document.createElement("div");
  ramme.className = "tabell-ramme";
  const hoder = o.kolonner.map((k) => k.navn).concat(o.beregnet || []);
  ramme.innerHTML = `<table class="sim-tabell alle"><thead><tr><th scope="col">Nr.</th>${hoder.map((h) => `<th scope="col">${h}</th>`).join("")}<th scope="col"><span class="hopp">Slett</span></th></tr></thead><tbody></tbody></table>`;
  const tbody = ramme.querySelector("tbody");
  const lerretEl = document.createElement("canvas");
  lerretEl.className = "statisk forhold-lav";
  lerretEl.setAttribute("role", "img");
  lerretEl.setAttribute("aria-label", o.graf?.beskrivelse || "Graf over målingene.");
  const plass = rot.querySelector("[data-tabell]") || rot;
  plass.append(ramme);
  if (o.linje !== "uten-graf") plass.append(lerretEl);
  const l = o.linje !== "uten-graf" ? Sim.lerret(lerretEl, tegn) : null;
  const knapper = document.createElement("div");
  knapper.className = "sim-styring mange";
  knapper.innerHTML = `<div class="sim-knapper"><button class="knapp lys" type="button" data-g="ny">Ny rad</button>${o.eksempel ? '<button class="knapp lys" type="button" data-g="eks">Fyll inn eksempel</button>' : ""}<button class="knapp lys" type="button" data-g="kopier">Kopier tabellen</button><button class="knapp lys" type="button" data-g="csv">Last ned som CSV</button><button class="knapp lys" type="button" data-g="tom">Tøm tabellen</button></div>`;
  plass.append(knapper);

  const inn = () => Object.fromEntries((o.innstillinger || []).map((id) => [id, $(id) ? $(id).value : ""]));
  let siste = { celler: [], pkt: [] }, fit = null;

  function tilpass(pkt) {
    if (o.linje === "origo") {
      let sxy = 0, sxx = 0;
      for (const p of pkt) { sxy += p.x * p.y; sxx += p.x * p.x; }
      return pkt.length >= 1 && sxx > 0 ? { a: sxy / sxx, b: 0 } : null;
    }
    if (o.linje === "fri") {
      const n = pkt.length; if (n < 2) return null;
      const mx = pkt.reduce((s, p) => s + p.x, 0) / n, my = pkt.reduce((s, p) => s + p.y, 0) / n;
      let sxy = 0, sxx = 0;
      for (const p of pkt) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }
      return sxx > 0 ? { a: sxy / sxx, b: my - sxy / sxx * mx } : null;
    }
    return null;
  }

  function tegnTabell() {
    tbody.innerHTML = rader.map((r, i) => `<tr><th scope="row">${i + 1}</th>${o.kolonner.map((k) => `<td><input data-rad="${i}" data-kol="${k.k}" type="text" inputmode="decimal" value="${String(r[k.k] ?? "").replace(/"/g, "")}" aria-label="${k.navn.replace(/<[^>]+>/g, "")}, måling ${i + 1}"></td>`).join("")}${(o.beregnet || []).map((_, j) => `<td data-c="${i}-${j}"></td>`).join("")}<td><button class="knapp lys liten" type="button" data-slett="${i}" aria-label="Slett måling ${i + 1}">×</button></td></tr>`).join("");
    oppdater();
  }

  function oppdater() {
    siste = o.analyser(rader, inn());
    fit = tilpass(siste.pkt);
    rader.forEach((_, i) => (o.beregnet || []).forEach((_, j) => {
      const td = tbody.querySelector(`[data-c="${i}-${j}"]`);
      if (td) td.textContent = siste.celler[i]?.[j] ?? "";
    }));
    const res = o.resultater ? o.resultater(fit, siste.pkt, inn(), siste) : {};
    for (const [id, tekst] of Object.entries(res)) if ($(id)) $(id).textContent = tekst;
    Sim.lagre(o.nokkel, { rader, inn: inn() });
    if (l) tegn();
  }

  function tegn() {
    if (!l || !l.b) return;
    const c = l.ctx, f = l.f, pkt = siste.pkt;
    l.tom();
    const xs = pkt.map((p) => p.x), ys = pkt.map((p) => p.y);
    const g = o.graf || {};
    let x0 = g.xMin ?? Math.min(0, ...xs), x1 = Math.max(g.xMaks ?? 1, ...xs) * 1.08;
    let y0 = g.yMin ?? Math.min(0, ...ys), y1 = Math.max(g.yMaks ?? 1, ...ys) * 1.12;
    if (y0 < 0) y0 *= 1.12;
    const { px, py } = Sim.akser(l, { x: [x0, x1], y: [y0, y1], xTekst: g.xTekst, yTekst: g.yTekst });
    if (fit) {
      c.save();
      c.beginPath(); c.rect(px(x0), py(y1), px(x1) - px(x0), py(y0) - py(y1)); c.clip();
      c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(px(x0), py(fit.a * x0 + fit.b)); c.lineTo(px(x1), py(fit.a * x1 + fit.b)); c.stroke();
      c.restore();
    }
    if (o.linje === "punkter" && pkt.length > 1) {
      c.strokeStyle = f.f2; c.lineWidth = 2; c.beginPath();
      pkt.forEach((p, i) => (i ? c.lineTo(px(p.x), py(p.y)) : c.moveTo(px(p.x), py(p.y))));
      c.stroke();
    }
    if (g.hjelpelinjer) {
      c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.setLineDash([2, 3]);
      for (const y of g.hjelpelinjer()) if (y > y0 && y < y1) { c.beginPath(); c.moveTo(px(x0), py(y)); c.lineTo(px(x1), py(y)); c.stroke(); }
      c.setLineDash([]);
    }
    c.fillStyle = f.f1;
    for (const p of pkt) { c.beginPath(); c.arc(px(p.x), py(p.y), 4.5, 0, 2 * Math.PI); c.fill(); }
  }

  tbody.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset.kol) return;
    rader[Number(t.dataset.rad)][t.dataset.kol] = t.value;
    oppdater();
  });
  tbody.addEventListener("click", (e) => {
    const i = e.target.dataset.slett;
    if (i === undefined) return;
    rader.splice(Number(i), 1);
    if (!rader.length) rader.push(tom());
    tegnTabell();
  });
  for (const id of o.innstillinger || []) if ($(id)) $(id).addEventListener("input", oppdater);

  const somTekst = (skille) => {
    const fmt = (s) => (skille === "," ? String(s).replace(",", ".") : String(s));
    const tekst = (h) => h.replace(/<sub>(.*?)<\/sub>/g, "$1").replace(/<[^>]+>/g, "");
    const linjer = [hoder.map(tekst).join(skille)];
    rader.forEach((r, i) => linjer.push(o.kolonner.map((k) => fmt(r[k.k] ?? "")).concat((siste.celler[i] || []).map((s) => fmt(String(s).replace(/\s/g, "").replace("−", "-")))).join(skille)));
    return linjer.join("\n");
  };
  knapper.addEventListener("click", (e) => {
    const g = e.target.dataset.g;
    if (g === "ny") { rader.push(tom()); tegnTabell(); }
    if (g === "eks") {
      for (const [id, v] of Object.entries(o.eksempel.inn || {})) if ($(id)) $(id).value = v;
      rader = o.eksempel.rader.map((r) => ({ ...tom(), ...r }));
      tegnTabell();
    }
    if (g === "tom") { if (!confirm("Vil du tømme tabellen?")) return; rader = Array.from({ length: o.startRader || 5 }, tom); tegnTabell(); }
    if (g === "kopier") Sim.kopier(somTekst("\t"), e.target);
    if (g === "csv") Sim.lastNed(somTekst(","), o.csv || "maalinger.csv");
  });
  tegnTabell();
  return { oppdater };
}
Maaletabell.tall = (s) => {
  const v = parseFloat(String(s ?? "").replace(",", ".").replace("−", "-"));
  return isFinite(v) ? v : null;
};
