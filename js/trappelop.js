// Trappeløp: regn ut arbeidet mot tyngden og effekten når du løper opp en trapp.

const G = 9.81;
const HK = 735.5; // 1 metrisk hestekraft i watt

function trappeEffekt(masse, trinn, trinnCm, tid) {
  const h = trinn * trinnCm / 100;
  const arbeid = masse * G * h;
  return { h, arbeid, effekt: arbeid / tid, perKg: arbeid / tid / masse };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("trapp");
  if (!el) return;
  const NOKKEL = "lektorbo-trappelop";
  const l = Sim.lerret(el, tegn);

  const tallFra = (id) => { const v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : null; };
  function data() {
    const masse = tallFra("masse"), trinn = tallFra("trinn"), trinnCm = tallFra("trinnhoyde"), tid = tallFra("tid");
    if (!masse || !trinn || !trinnCm || !tid) return null;
    return { masse, trinn: Math.round(trinn), trinnCm, tid, ...trappeEffekt(masse, Math.round(trinn), trinnCm, tid) };
  }

  // Sammenligning
  const REFERANSER = [
    { navn: "Menneske i hvile", w: 100 },
    { navn: "Proff syklist i en time", w: 400 },
    { navn: "1 hestekraft", w: HK },
    { navn: "Vannkoker", w: 2000 },
  ];

  function oppdater() {
    const d = data();
    $("r-hoyde").textContent = d ? komma(d.h, 2) + " m" : "–";
    $("r-arbeid").textContent = d ? komma(d.arbeid / 1000, 2) + " kJ" : "–";
    $("r-effekt").textContent = d ? komma(d.effekt, 0) + " W" : "–";
    $("r-hk").textContent = d ? komma(d.effekt / HK, 2) + " hk" : "–";
    $("r-perkg").textContent = d ? komma(d.perKg, 1) + " W/kg" : "–";
    const rader = [...REFERANSER];
    if (d) rader.push({ navn: "Deg", w: d.effekt, deg: true });
    rader.sort((a, b) => a.w - b.w);
    const maks = Math.max(...rader.map((r) => r.w));
    $("sammenligning").innerHTML = rader.map((r) =>
      `<li class="${r.deg ? "deg" : ""}"><span>${r.navn}</span><span class="stolpe"><span style="width:${(100 * r.w / maks).toFixed(1)}%"></span></span><span class="verdi">${komma(r.w, 0)} W</span></li>`).join("");
    if (!avspiller.kjorer) { avspiller.stopp(); fremdrift = 1; tegn(); }
  }

  // Animasjon av løpet i virkelig tid
  let fremdrift = 1;
  function steg(dt) {
    const d = data();
    if (!d) return false;
    fremdrift = Math.min(1, fremdrift + dt / d.tid);
    $("klokke").textContent = komma(fremdrift * d.tid, 1) + " s";
    tegn();
    return fremdrift < 1;
  }
  const avspiller = Sim.avspiller({ knapp: $("vis-lop"), steg, nullstill: () => { fremdrift = 0; }, lerret: el,
    tekster: { klar: "Vis løpet", ferdig: "Vis løpet igjen" } });
  // Kjøres før avspillerens egen klikkhandler, slik at løpet starter fra bunnen
  $("vis-lop").addEventListener("click", () => { if (avspiller.tilstand === "klar") fremdrift = 0; }, true);

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f, d = data();
    l.tom();
    const trinn = d ? Math.min(d.trinn, 40) : 15, trinnCm = d ? d.trinnCm : 17;
    const marg = 24, stolpeB = 54;
    const bTrapp = l.b - 2 * marg - stolpeB - 20, hTrapp = l.h - 2 * marg;
    // Trinnene tegnes med riktig forhold mellom høyde og dybde (dybde ≈ 28 cm)
    const sk = Math.min(bTrapp / (trinn * 28), hTrapp / (trinn * trinnCm + 180));
    const x0 = marg, y0 = l.h - marg;
    c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x0, y0);
    for (let i = 0; i < trinn; i++) {
      c.lineTo(x0 + i * 28 * sk, y0 - (i + 1) * trinnCm * sk);
      c.lineTo(x0 + (i + 1) * 28 * sk, y0 - (i + 1) * trinnCm * sk);
    }
    c.lineTo(x0 + (trinn + 1.5) * 28 * sk, y0 - trinn * trinnCm * sk);
    c.stroke();

    // Høydepil
    const hx = x0 + (trinn + 1.5) * 28 * sk + 8;
    c.strokeStyle = f.dempet; c.lineWidth = 1; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(hx, y0); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(hx, y0); c.lineTo(hx, y0 - trinn * trinnCm * sk); c.stroke();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText("h = " + (d ? komma(d.h, 2) : "?") + " m", hx + 6, y0 - trinn * trinnCm * sk / 2);

    // Løperen: en enkel strekfigur som tar ett trinn om gangen
    const pos = fremdrift * trinn, i = Math.min(trinn - 1e-9, pos), hel = Math.floor(i), del = i - hel;
    const fotX = x0 + (hel + 0.5 + del) * 28 * sk;
    const fotY = y0 - (hel + Math.min(1, del * 2)) * trinnCm * sk;
    const kropp = Math.max(28, 150 * sk), hode = kropp * 0.13;
    const sving = 0.5 + Math.sin(pos * Math.PI) * 0.4;
    c.strokeStyle = f.f1; c.fillStyle = f.f1; c.lineWidth = Math.max(2, kropp * 0.03); c.lineCap = "round";
    const hofte = [fotX, fotY - kropp * 0.48], skulder = [fotX + kropp * 0.06, fotY - kropp * 0.8];
    c.beginPath();
    c.moveTo(hofte[0] + kropp * 0.18 * sving, fotY); c.lineTo(...hofte); c.lineTo(hofte[0] - kropp * 0.18 * sving, fotY - kropp * 0.06);
    c.moveTo(...hofte); c.lineTo(...skulder);
    c.moveTo(skulder[0] - kropp * 0.2 * sving, skulder[1] + kropp * 0.3); c.lineTo(...skulder); c.lineTo(skulder[0] + kropp * 0.2 * sving, skulder[1] + kropp * 0.28);
    c.stroke();
    c.beginPath(); c.arc(skulder[0] + 2, skulder[1] - hode * 1.2, hode, 0, 2 * Math.PI); c.fill();
    c.lineCap = "butt";

    // Stolpe for potensiell energi
    const sxs = l.b - marg - stolpeB, sh = hTrapp - 20;
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    c.strokeRect(sxs + 14, y0 - sh, 26, sh);
    c.fillStyle = f.f1;
    const andel = Math.min(1, (hel + Math.min(1, del * 2)) / trinn);
    c.fillRect(sxs + 14, y0 - sh * andel, 26, sh * andel);
    c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillText("Ep", sxs + 27, y0 - sh - 4);
    c.textBaseline = "top";
    c.fillText(d ? komma(d.arbeid * andel / 1000, 1) + " kJ" : "", sxs + 27, y0 + 4);
    if (d && d.trinn > 40) { c.textAlign = "left"; c.fillText("Viser 40 av " + d.trinn + " trinn", x0, 4); }
  }

  // Stoppeklokke
  let stoppStart = null, stoppId = null;
  $("stoppeklokke").addEventListener("click", (e) => {
    const k = e.currentTarget;
    if (stoppStart === null) {
      stoppStart = performance.now();
      k.textContent = "Stopp";
      k.classList.add("aktiv");
      const tikk = () => { $("klokke").textContent = komma((performance.now() - stoppStart) / 1000, 1) + " s"; stoppId = requestAnimationFrame(tikk); };
      tikk();
    } else {
      cancelAnimationFrame(stoppId);
      const s = (performance.now() - stoppStart) / 1000;
      $("tid").value = s.toFixed(2);
      $("klokke").textContent = komma(s, 2) + " s";
      stoppStart = null;
      k.textContent = "Start stoppeklokke";
      k.classList.remove("aktiv");
      oppdater();
    }
  });

  // Klassetabell, lagret bare i denne nettleseren
  let liste = Sim.hent(NOKKEL, []);
  if (!Array.isArray(liste)) liste = [];
  function visListe() {
    $("liste").innerHTML = liste.length ? liste.map((r, i) =>
      `<tr><th scope="row">${r.navn.replace(/[<>&"]/g, "")}</th><td>${komma(r.masse, 0)} kg</td><td>${komma(r.h, 2)} m</td><td>${komma(r.tid, 2)} s</td><td>${komma(r.effekt, 0)} W</td><td>${komma(r.perKg, 1)} W/kg</td>` +
      `<td><button class="knapp lys liten" type="button" data-slett="${i}" aria-label="Slett raden">Slett</button></td></tr>`).join("")
      : `<tr><td colspan="7" class="tom-rad">Ingen målinger ennå.</td></tr>`;
    const snitt = liste.length ? liste.reduce((a, r) => a + r.effekt, 0) / liste.length : null;
    $("snitt").textContent = snitt ? komma(snitt, 0) + " W" : "–";
    const best = liste.length ? Math.max(...liste.map((r) => r.perKg)) : null;
    $("best").textContent = best ? komma(best, 1) + " W/kg" : "–";
  }
  $("legg-til").addEventListener("click", () => {
    const d = data();
    if (!d) { $("melding").textContent = "Fyll inn masse, antall trinn, trinnhøyde og tid først."; return; }
    const navn = $("navn").value.trim() || "Måling " + (liste.length + 1);
    liste.push({ navn: navn.slice(0, 40), masse: d.masse, h: d.h, tid: d.tid, effekt: d.effekt, perKg: d.perKg });
    Sim.lagre(NOKKEL, liste);
    $("melding").textContent = "";
    $("navn").value = "";
    visListe();
  });
  $("liste").addEventListener("click", (e) => {
    const i = e.target.dataset.slett;
    if (i === undefined) return;
    liste.splice(Number(i), 1);
    Sim.lagre(NOKKEL, liste);
    visListe();
  });
  $("tom-liste").addEventListener("click", () => {
    if (!liste.length || !confirm("Vil du slette alle målingene i tabellen?")) return;
    liste = [];
    Sim.lagre(NOKKEL, liste);
    visListe();
  });
  const somTekst = (skille) => [["navn", "masse_kg", "hoyde_m", "tid_s", "effekt_W", "effekt_per_kg"].join(skille),
    ...liste.map((r) => [r.navn, r.masse, r.h.toFixed(3), r.tid, r.effekt.toFixed(1), r.perKg.toFixed(2)].join(skille))].join("\n");
  $("kopier-liste").addEventListener("click", (e) => Sim.kopier(somTekst("\t"), e.currentTarget));
  $("last-ned").addEventListener("click", () => Sim.lastNed(somTekst(","), "trappelop.csv"));

  for (const id of ["masse", "trinn", "trinnhoyde", "tid"]) $(id).addEventListener("input", oppdater);
  visListe();
  oppdater();
  l.tilpass();
})();
