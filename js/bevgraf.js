// Bevegelsesgrafer: En bevegelse bygd av opptil fire deler med konstant akselerasjon.
// Viser objektet på en bane og grafene for posisjon, fart og akselerasjon.
// «Følg grafen»: Eleven styrer farten og prøver å følge en gitt posisjonsgraf.

const OPPSETT = {
  konstant: { x0: 0, v0: 2, deler: [[6, 0]] },
  akselerasjon: { x0: 0, v0: 0, deler: [[5, 1.2]] },
  bil: { x0: 0, v0: 0, deler: [[4, 2.5], [4, 0], [2.5, -4]] },
  snu: { x0: 0, v0: 3, deler: [[6, -1]] },
};

// Tilstanden ved tiden t
function tilstand(o, t) {
  let x = o.x0, v = o.v0, tid = 0, strekning = 0;
  for (const [dt, a] of o.deler) {
    const d = Math.min(dt, Math.max(0, t - tid));
    // Strekning: tar hensyn til at farten kan skifte fortegn i delen
    const tSnu = a !== 0 ? -v / a : -1;
    if (tSnu > 0 && tSnu < d) strekning += Math.abs(v * tSnu + 0.5 * a * tSnu * tSnu) + Math.abs(0.5 * a * (d - tSnu) ** 2);
    else strekning += Math.abs(v * d + 0.5 * a * d * d);
    x += v * d + 0.5 * a * d * d; v += a * d; tid += dt;
    if (t <= tid) return { x, v, a, strekning };
  }
  return { x, v, a: 0, strekning };
}
const varighet = (o) => o.deler.reduce((s, [dt]) => s + dt, 0);

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("bane");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("grafer"), tegn);
  let o = null, tid = 0;

  function lesTabell() {
    const tall = (s) => { const v = parseFloat(String(s).replace(",", ".").replace("−", "-")); return isFinite(v) ? v : null; };
    const deler = [];
    for (let i = 0; i < 4; i++) {
      const dt = tall($("dt" + i).value), a = tall($("a" + i).value);
      if (dt !== null && dt > 0 && a !== null) deler.push([Math.min(dt, 30), Math.max(-20, Math.min(20, a))]);
    }
    return { x0: tall($("x0").value) ?? 0, v0: tall($("v0").value) ?? 0, deler: deler.length ? deler : [[5, 0]] };
  }
  function fyllTabell(op) {
    $("x0").value = String(op.x0).replace(".", ","); $("v0").value = String(op.v0).replace(".", ",");
    for (let i = 0; i < 4; i++) {
      const d = op.deler[i];
      $("dt" + i).value = d ? String(d[0]).replace(".", ",") : "";
      $("a" + i).value = d ? String(d[1]).replace(".", ",").replace("-", "−") : "";
    }
  }
  function nullstill() { avspiller.stopp(); o = lesTabell(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(varighet(o), tid + dt * Number($("tempo").value)); oppdater(); return tid < varighet(o); }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function område() {
    const T = varighet(o); let min = Infinity, maks = -Infinity, vmin = 0, vmaks = 0;
    for (let k = 0; k <= 400; k++) { const s = tilstand(o, T * k / 400); min = Math.min(min, s.x); maks = Math.max(maks, s.x); vmin = Math.min(vmin, s.v); vmaks = Math.max(vmaks, s.v); }
    const amaks = Math.max(0.5, ...o.deler.map(([, a]) => Math.abs(a)));
    return { T, min: Math.min(0, min), maks: Math.max(maks, min + 1), vmin, vmaks: Math.max(vmaks, vmin + 0.5), amaks };
  }

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const om = område(), marg = 30, y = l.h * 0.62;
    const X = (x) => marg + (x - om.min) / (om.maks - om.min) * (l.b - 2 * marg);
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(marg - 10, y); c.lineTo(l.b - marg + 10, y); c.stroke();
    const steg = Sim.steglengde(om.maks - om.min, l.b < 560 ? 4 : 8);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top"; c.lineWidth = 1;
    for (let x = Math.ceil(om.min / steg) * steg; x <= om.maks + 1e-9; x += steg) { c.beginPath(); c.moveTo(X(x), y); c.lineTo(X(x), y + 5); c.stroke(); c.fillText(komma(x, steg < 1 ? 1 : 0), X(x), y + 7); }
    c.textAlign = "right"; c.fillText("x / m", l.b - 4, y + 7);
    // Stroboskopmerker hvert halve sekund
    if ($("strobe").checked) {
      c.fillStyle = f.f2; c.globalAlpha = 0.55;
      for (let t = 0; t <= tid + 1e-9; t += 0.5) { c.beginPath(); c.arc(X(tilstand(o, t).x), y - 22, 4, 0, 2 * Math.PI); c.fill(); }
      c.globalAlpha = 1;
    }
    const s = tilstand(o, tid);
    c.fillStyle = f.f1; c.beginPath(); c.roundRect(X(s.x) - 14, y - 16, 28, 14, 3); c.fill();
    // Fartspil
    if (Math.abs(s.v) > 0.01) {
      const L = Math.max(-80, Math.min(80, s.v * 12)), yP = y - 30;
      c.strokeStyle = f.blekk; c.fillStyle = f.blekk; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(X(s.x), yP); c.lineTo(X(s.x) + L - Math.sign(L) * 6, yP); c.stroke();
      c.beginPath(); c.moveTo(X(s.x) + L, yP); c.lineTo(X(s.x) + L - Math.sign(L) * 8, yP - 5); c.lineTo(X(s.x) + L - Math.sign(L) * 8, yP + 5); c.fill();
    }
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", l.b - 8, 6);
  }

  function tegnGrafer() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const om = område(), smal = l.b < 560;
    const paneler = [
      { navn: "x / m", fn: (s) => s.x, y: [om.min, om.maks] },
      { navn: "v / (m/s)", fn: (s) => s.v, y: [Math.min(0, om.vmin) * 1.1, om.vmaks * 1.1] },
      { navn: "a / (m/s²)", fn: (s) => s.a, y: [-om.amaks * 1.2, om.amaks * 1.2] },
    ];
    const h = l.h / 3;
    paneler.forEach((p, k) => {
      const del = { ctx: c, b: l.b, h: h, f };
      c.save(); c.translate(0, k * h);
      const { px, py } = Sim.akser(del, { x: [0, om.T], y: p.y, ySteg: Sim.steglengde(p.y[1] - p.y[0], 5), xTekst: k === 2 ? "t / s" : "", yTekst: p.navn, marg: { v: smal ? 40 : 50, n: 22, o: 14 } });
      if (k === 1 && $("areal").checked) {
        c.fillStyle = f.f2; c.globalAlpha = 0.18; c.beginPath(); c.moveTo(px(0), py(0));
        for (let i = 0; i <= 200; i++) { const t = tid * i / 200; c.lineTo(px(t), py(tilstand(o, t).v)); }
        c.lineTo(px(tid), py(0)); c.closePath(); c.fill(); c.globalAlpha = 1;
      }
      c.strokeStyle = [f.f1, f.f2, f.blekk][k]; c.lineWidth = 2; c.beginPath();
      const n = 300;
      for (let i = 0; i <= n; i++) {
        const t = tid * i / n, s = tilstand(o, t);
        // Akselerasjonen hopper mellom delene: tegn den som trapp
        i ? c.lineTo(px(t), py(p.fn(s))) : c.moveTo(px(t), py(p.fn(s)));
      }
      c.stroke();
      c.restore();
    });
  }

  function tegn() { if (!o) return; if (scene.b) tegnScene(); if (graf.b) tegnGrafer(); }

  function oppdater() {
    const s = tilstand(o, tid);
    $("r-x").textContent = komma(s.x, 2) + " m";
    $("r-v").textContent = komma(s.v, 2) + " m/s";
    $("r-a").textContent = komma(tid >= varighet(o) ? 0 : s.a, 2) + " m/s²";
    $("r-s").textContent = komma(s.strekning, 2) + " m";
    $("r-dx").textContent = komma(s.x - o.x0, 2) + " m";
    tegn();
  }

  $("oppsett").addEventListener("input", () => { const op = OPPSETT[$("oppsett").value]; if (op) { fyllTabell(op); nullstill(); } });
  $("deler").addEventListener("input", () => { $("oppsett").value = "egen"; nullstill(); });
  for (const id of ["strobe", "areal"]) $(id).addEventListener("input", tegn);
  fyllTabell(OPPSETT.bil); $("oppsett").value = "bil";
  nullstill();
})();

// Følg grafen
// Farten velges med glidebryteren før start (startfart) og beholdes når man trykker Start.
// Piltastene styrer farten (opp/høyre øker, ned/venstre minker, Shift gir større steg) mens spillet går,
// og når fokus er inne i figuren. Da ruller ikke siden.
(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("folg");
  if (!el) return;
  const fig = el.closest("figure");
  const fart = $("f-fart"), STEG = 0.2, STORT_STEG = 0.5;
  const visFart = () => { $("f-fart-ut").textContent = komma(Number(fart.value), 1) + " m/s"; };
  function settFart(v) {
    const min = Number(fart.min), maks = Number(fart.max);
    fart.value = String(Math.round(Math.max(min, Math.min(maks, v)) * 10) / 10);
    visFart();
    if (!kjører) tegn();
  }
  const l = Sim.lerret(el, tegn);
  const T = 12, XMAKS = 8;
  let mål = [], spor = [], x = 2, tid = 0, kjører = false, forrige = null;

  function nyttMål() {
    const knekk = [[0, 2]];
    let xx = 2;
    for (let k = 1; k <= 4; k++) {
      let v; do { v = Math.round((Math.random() * 3 - 1.5) * 10) / 10; } while (Math.abs(v) < 0.3);
      xx += v * 3;
      if (xx > XMAKS - 0.5 || xx < 0.5) { xx -= 2 * v * 3; }
      knekk.push([k * 3, Math.max(0.3, Math.min(XMAKS - 0.3, xx))]);
    }
    mål = knekk;
    spor = []; x = 2; tid = 0; $("f-poeng").textContent = "–"; tegn();
  }
  const målX = (t) => { for (let k = 1; k < mål.length; k++) if (t <= mål[k][0]) { const [t0, x0] = mål[k - 1], [t1, x1] = mål[k]; return x0 + (x1 - x0) * (t - t0) / (t1 - t0); } return mål[mål.length - 1][1]; };

  function bilde(naa) {
    if (!kjører) return;
    const dt = forrige === null ? 0 : Math.min(0.05, (naa - forrige) / 1000);
    forrige = naa;
    const v = Number(fart.value);
    x = Math.max(0, Math.min(XMAKS, x + v * dt));
    tid += dt; spor.push([tid, x]);
    if (tid >= T) {
      kjører = false; $("f-start").textContent = "Prøv igjen";
      const avvik = spor.reduce((s, [t, xx]) => s + Math.abs(xx - målX(t)), 0) / spor.length;
      $("f-poeng").textContent = komma(avvik, 2) + " m i snitt" + (avvik < 0.15 ? " – svært bra!" : avvik < 0.4 ? " – bra!" : "");
    }
    tegn();
    if (kjører) requestAnimationFrame(bilde);
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const { px, py } = Sim.akser(l, { x: [0, T], y: [0, XMAKS], xTekst: "t / s", yTekst: "x / m" });
    c.strokeStyle = f.dempet; c.setLineDash([6, 4]); c.lineWidth = 2.5; c.beginPath();
    mål.forEach(([t, xx], k) => (k ? c.lineTo(px(t), py(xx)) : c.moveTo(px(t), py(xx)))); c.stroke(); c.setLineDash([]);
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    spor.forEach(([t, xx], k) => (k ? c.lineTo(px(t), py(xx)) : c.moveTo(px(t), py(xx)))); c.stroke();
    c.fillStyle = f.f1; c.beginPath(); c.arc(px(tid), py(x), 5, 0, 2 * Math.PI); c.fill();
    // Før start: en kort pil fra startpunktet viser hvilken startfart som er valgt
    if (!kjører && !spor.length) {
      const v = Number(fart.value), dt = 1.5;
      c.strokeStyle = f.f1; c.lineWidth = 2; c.setLineDash([2, 4]);
      c.beginPath(); c.moveTo(px(0), py(x)); c.lineTo(px(dt), py(Math.max(0, Math.min(XMAKS, x + v * dt)))); c.stroke();
      c.setLineDash([]);
    }
  }

  $("f-start").addEventListener("click", () => {
    if (kjører) return;
    spor = [[0, 2]]; x = 2; tid = 0; $("f-poeng").textContent = "–";
    kjører = true; forrige = null; $("f-start").textContent = "Kjører …";
    requestAnimationFrame(bilde);
  });
  $("f-ny").addEventListener("click", () => { kjører = false; $("f-start").textContent = "Start"; nyttMål(); });
  fart.addEventListener("input", () => { visFart(); if (!kjører) tegn(); });
  document.addEventListener("keydown", (e) => {
    const retning = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (!retning || e.altKey || e.ctrlKey || e.metaKey) return;
    const aktiv = document.activeElement;
    const iFigur = fig.contains(aktiv);
    if (!kjører && !iFigur) return;                                  // ellers vanlig rulling av siden
    if (aktiv && aktiv.matches("input:not([type=range]), select, textarea")) return;
    e.preventDefault();
    settFart(Number(fart.value) + retning * (e.shiftKey ? STORT_STEG : STEG));
  });
  visFart();
  nyttMål();
})();
