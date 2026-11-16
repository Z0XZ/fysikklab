// Impuls fra kraftsensor. Elevene limer inn målinger av kraft mot tid og får regnet ut arealet under grafen
// med trapesmetoden. Arealet sammenlignes med endringen i bevegelsesmengde, Δp = m(v_etter − v_før).

// Leser to kolonner med tall. Godtar tabulator, semikolon, komma eller mellomrom som skille og desimalkomma.
function lesData(tekst) {
  const punkter = [];
  for (const linje of tekst.split(/\r?\n/)) {
    const l = linje.trim();
    if (!l) continue;
    let deler;
    if (/[\t;]/.test(l)) deler = l.split(/\s*[\t;]\s*/);
    else if (/\s/.test(l)) deler = l.split(/\s+/);
    else {
      // Bare komma: «0.1,2.3» har komma som skille, «0,1,2,3» er to tall med desimalkomma
      const d = l.split(",");
      deler = d.length === 2 || l.includes(".") ? d : [d[0] + "," + d[1], d.slice(2).join(",")];
    }
    const tall = deler.map((d) => parseFloat(d.replace(",", ".").replace("−", "-")));
    if (tall.length >= 2 && isFinite(tall[0]) && isFinite(tall[1])) punkter.push({ t: tall[0], F: tall[1] });
  }
  return punkter.sort((a, b) => a.t - b.t);
}

// Finner tidsrommet der kraften er større enn en andel av toppverdien, og regner ut arealet med trapesmetoden
function impuls(punkter, terskelAndel = 0.05) {
  if (punkter.length < 3) return null;
  const maks = punkter.reduce((a, b) => (Math.abs(b.F) > Math.abs(a.F) ? b : a));
  const grense = Math.abs(maks.F) * terskelAndel;
  let i0 = punkter.indexOf(maks), i1 = i0;
  while (i0 > 0 && Math.abs(punkter[i0 - 1].F) > grense) i0--;
  while (i1 < punkter.length - 1 && Math.abs(punkter[i1 + 1].F) > grense) i1++;
  i0 = Math.max(0, i0 - 1); i1 = Math.min(punkter.length - 1, i1 + 1);
  let areal = 0;
  for (let i = i0 + 1; i <= i1; i++) areal += (punkter[i].t - punkter[i - 1].t) * (punkter[i].F + punkter[i - 1].F) / 2;
  return { areal, i0, i1, tStart: punkter[i0].t, tSlutt: punkter[i1].t, Fmaks: maks.F };
}

// Eksempeldata: en vogn på 0,50 kg med fjærstøtfanger treffer kraftsensoren med 0,60 m/s og spretter tilbake med 0,48 m/s.
// Data er laget med en enkel modell og litt støy, og er ikke ekte målinger.
function eksempeldata() {
  const m = 0.5, v0 = 0.6, e = 0.8, k = 120, linjer = [];
  let x = 0, v = v0, maks = 0, støy = 7;
  const tilfeldig = () => { støy = (støy * 16807) % 2147483647; return støy / 2147483647 - 0.5; };
  for (let i = 0; i <= 120; i++) {
    const t = i * 0.005;
    // 50 delsteg per måling
    for (let j = 0; j < 50 && t > 0.2; j++) {
      const dt = 0.0001;
      let F = 0;
      if (x > 0) F = v > 0 ? k * x : Math.max(0, k / (e * e) * (x - maks * (1 - e * e)));
      if (x > maks) maks = x;
      v -= F / m * dt; x += v * dt;
      if (x < 0 && v < 0) x = -1;
    }
    let F = 0;
    if (x > 0) F = v > 0 ? k * x : Math.max(0, k / (e * e) * (x - maks * (1 - e * e)));
    linjer.push(t.toFixed(3).replace(".", ",") + "\t" + (F + tilfeldig() * 0.06).toFixed(3).replace(".", ","));
  }
  return { tekst: linjer.join("\n"), m: "0,50", vFør: "0,60", vEtter: "−0,48" };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const felt = $("k-data");
  if (!felt) return;
  const NOKKEL = "lektorbo-kraftsensor";
  const l = Sim.lerret($("k-graf"), tegn);
  const lagret = Sim.hent(NOKKEL, null);
  if (lagret) for (const id of ["k-data", "k-masse", "k-vfor", "k-vetter"]) $(id).value = lagret[id] || "";

  const tall = (id) => { const v = parseFloat(String($(id).value).replace(",", ".").replace("−", "-")); return isFinite(v) ? v : null; };
  let punkter = [], res = null;

  function beregn() {
    punkter = lesData(felt.value);
    res = impuls(punkter, Number($("k-terskel").value) / 100);
    const m = tall("k-masse"), vf = tall("k-vfor"), ve = tall("k-vetter");
    const dp = m !== null && vf !== null && ve !== null ? m * (ve - vf) : null;
    $("k-antall").textContent = punkter.length ? punkter.length + " målinger" : "–";
    $("k-areal").textContent = res ? komma(res.areal, 3) + " Ns" : "–";
    $("k-tid").textContent = res ? komma((res.tSlutt - res.tStart) * 1000, 0) + " ms" : "–";
    $("k-maks").textContent = res ? komma(res.Fmaks, 2) + " N" : "–";
    $("k-dp").textContent = dp !== null ? komma(dp, 3) + " kg m/s" : "–";
    $("k-avvik").textContent = dp !== null && res && Math.abs(dp) > 1e-9 ? komma((Math.abs(res.areal) - Math.abs(dp)) / Math.abs(dp) * 100, 1) + " %" : "–";
    Sim.lagre(NOKKEL, Object.fromEntries(["k-data", "k-masse", "k-vfor", "k-vetter"].map((id) => [id, $(id).value])));
    tegn();
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    if (punkter.length < 2) {
      c.fillStyle = f.dempet; c.font = "14px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Lim inn målinger eller trykk «Fyll inn eksempel».", l.b / 2, l.h / 2);
      return;
    }
    const ts = punkter.map((p) => p.t), Fs = punkter.map((p) => p.F);
    let y0 = Math.min(0, ...Fs), y1 = Math.max(0, ...Fs);
    const pad = (y1 - y0 || 1) * 0.1; y1 += pad; if (y0 < 0) y0 -= pad;
    const { px, py } = Sim.akser(l, { x: [Math.min(...ts), Math.max(...ts)], y: [y0, y1], xTekst: "t / s", yTekst: "F / N" });
    if (res) {
      c.fillStyle = f.f2; c.globalAlpha = 0.25; c.beginPath(); c.moveTo(px(punkter[res.i0].t), py(0));
      for (let i = res.i0; i <= res.i1; i++) c.lineTo(px(punkter[i].t), py(punkter[i].F));
      c.lineTo(px(punkter[res.i1].t), py(0)); c.closePath(); c.fill(); c.globalAlpha = 1;
    }
    c.strokeStyle = f.f2; c.lineWidth = 2; c.beginPath();
    punkter.forEach((p, i) => (i ? c.lineTo(px(p.t), py(p.F)) : c.moveTo(px(p.t), py(p.F))));
    c.stroke();
    if (punkter.length < 400) {
      c.fillStyle = f.f2;
      for (const p of punkter) { c.beginPath(); c.arc(px(p.t), py(p.F), 2, 0, 2 * Math.PI); c.fill(); }
    }
  }

  for (const id of ["k-data", "k-masse", "k-vfor", "k-vetter", "k-terskel"]) $(id).addEventListener("input", beregn);
  $("k-terskel").addEventListener("input", () => { $("k-terskel-ut").textContent = $("k-terskel").value + " %"; });
  $("k-eksempel").addEventListener("click", () => {
    const e = eksempeldata();
    felt.value = e.tekst; $("k-masse").value = e.m; $("k-vfor").value = e.vFør; $("k-vetter").value = e.vEtter;
    beregn();
  });
  $("k-tom").addEventListener("click", () => { for (const id of ["k-data", "k-masse", "k-vfor", "k-vetter"]) $(id).value = ""; beregn(); });
  $("k-terskel-ut").textContent = $("k-terskel").value + " %";
  beregn();
})();
