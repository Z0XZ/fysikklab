// Ekvivalensprinsippet. En ball kastes vannrett og en lyspuls sendes vannrett fra venstre vegg i en heis.
// Fire situasjoner: i ro på jorda, akselererer med a = g i rommet, faller fritt, og svever i ro i rommet.
// Inne i heisen faller alt med g_inne (g eller 0). Utenfra: posisjon = heisens posisjon + posisjon inne i heisen.
// Lysfarten i tegningen er satt ned, så avbøyningen synes. Den ekte avbøyningen vises som tall.

const EK_G = 9.81, EK_C = 2.998e8, EK_B = 3.0, EK_H = 2.5, EK_Y0 = 1.6;
const EK_SCENER = {
  jord: { navn: "I ro på jorda", gInne: EK_G, heis: 0, tekst: "Heisen står i ro på jorda. Tyngdekraften trekker alt nedover." },
  rakett: { navn: "Akselererer i rommet", gInne: EK_G, heis: 1, tekst: "Heisen er i en rakett langt ute i rommet og akselererer oppover med a = 9,81 m/s². Ingen tyngdekraft." },
  fall: { navn: "Faller fritt", gInne: 0, heis: -1, tekst: "Kabelen er kuttet, og heisen faller fritt på jorda (uten luftmotstand)." },
  rom: { navn: "Svever i rommet", gInne: 0, heis: 0, tekst: "Heisen svever i ro langt ute i rommet. Ingen tyngdekraft og ingen akselerasjon." },
};

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("ek-scene");
  if (!el) return;
  let scene = "jord", vb, cv, t = 0, tSlutt = 1;
  const l = Sim.lerret(el, tegn);

  function les() {
    vb = Sim.verdi("ek-vb", (x) => komma(x, 1) + " m/s");
    cv = Sim.verdi("ek-c", (x) => komma(x, 0) + " m/s");
    const sc = EK_SCENER[scene];
    // Ballen stopper når den treffer gulvet eller høyre vegg, lyset når det treffer veggen (eller gulvet)
    const tGulv = (g) => (g > 0 ? Math.sqrt(2 * EK_Y0 / g) : Infinity);
    tSlutt = Math.max(Math.min(EK_B / vb, tGulv(sc.gInne)), Math.min(EK_B / cv, tGulv(sc.gInne)));
    $("ek-tekst").textContent = sc.tekst;
    for (const k of document.querySelectorAll("[data-ek]")) k.classList.toggle("aktiv", k.dataset.ek === scene);
  }
  const inne = (v, tt) => {
    const g = EK_SCENER[scene].gInne, tGulv = g > 0 ? Math.sqrt(2 * EK_Y0 / g) : Infinity;
    const ts = Math.min(tt, EK_B / v, tGulv);
    return { x: v * ts, y: EK_Y0 - 0.5 * g * ts * ts };
  };
  const heisY = (tt) => EK_SCENER[scene].heis * 0.5 * EK_G * tt * tt;

  function steg(dt) { t = Math.min(tSlutt, t + dt * Number($("ek-tempo").value)); tegn(); return t < tSlutt; }
  const avspiller = Sim.avspiller({ knapp: $("ek-start"), steg, nullstill: () => { t = 0; }, lerret: el });

  function panel(c, f, x0, bredde, h, tittel, utenfra) {
    const sc = EK_SCENER[scene];
    // Utsnitt: hele heisen gjennom bevegelsen
    const yEnd = heisY(tSlutt);
    const ymin = utenfra ? Math.min(0, yEnd) - 0.4 : -0.4, ymax = utenfra ? Math.max(EK_H, yEnd + EK_H) + 0.4 : EK_H + 0.4;
    const s = Math.min((bredde - 30) / (EK_B + 0.8), (h - 50) / (ymax - ymin));
    const ox = x0 + (bredde - EK_B * s) / 2, oy = h - 20 + ymin * s;
    const P = (x, y) => [ox + x * s, oy - y * s];
    c.fillStyle = f.blekk; c.font = "600 13px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText(tittel, x0 + bredde / 2, 6);
    const ye = utenfra ? heisY(t) : 0;
    if (utenfra && scene === "jord" || utenfra && scene === "fall") {
      const [, yb] = P(0, Math.min(0, heisY(tSlutt)) - 0.2);
      c.fillStyle = f.rute; c.fillRect(x0 + 4, yb, bredde - 8, h - yb);
    }
    // Heisen, og der den var ved start (stiplet)
    if (utenfra && sc.heis) {
      const [sx0, sy0] = P(0, EK_H);
      c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.setLineDash([4, 4]); c.strokeRect(sx0, sy0, EK_B * s, EK_H * s); c.setLineDash([]);
    }
    const [hx, hy] = P(0, ye + EK_H);
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.strokeRect(hx, hy, EK_B * s, EK_H * s);
    if (utenfra && scene === "rakett") { c.fillStyle = f.f1; c.beginPath(); const [fx, fy] = P(EK_B / 2, ye); c.moveTo(fx - 14, fy); c.lineTo(fx + 14, fy); c.lineTo(fx, fy + 30); c.closePath(); c.fill(); }
    // Baner
    const spor = (v, farge, bredde) => {
      c.strokeStyle = farge; c.lineWidth = bredde; c.beginPath();
      for (let i = 0; i <= 80; i++) {
        const tt = t * i / 80, p = inne(v, tt), y = p.y + (utenfra ? heisY(Math.min(tt, t)) : 0);
        const q = utenfra ? [p.x, y] : [p.x, p.y];
        const [X, Y] = P(...q); i ? c.lineTo(X, Y) : c.moveTo(X, Y);
      }
      c.stroke();
      const p = inne(v, t), [X, Y] = P(p.x, p.y + (utenfra ? heisY(t) : 0));
      c.fillStyle = farge; c.beginPath(); c.arc(X, Y, bredde * 2.2, 0, 2 * Math.PI); c.fill();
    };
    spor(vb, f.f2, 2);
    spor(cv, "#e0a400", 2.5);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "left";
    if (utenfra && sc.heis) c.fillText(sc.heis > 0 ? "heisen akselererer opp" : "heisen faller", x0 + 8, h - 16);
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f, b = l.b, h = l.h;
    l.tom();
    panel(c, f, 0, b / 2, h, "Sett innenfra", false);
    c.strokeStyle = f.rute; c.beginPath(); c.moveTo(b / 2, 10); c.lineTo(b / 2, h - 10); c.stroke();
    panel(c, f, b / 2, b / 2, h, "Sett utenfra", true);
    tall();
  }

  function tall() {
    const g = EK_SCENER[scene].gInne, pb = inne(vb, t), pl = inne(cv, t);
    $("ek-t").textContent = komma(t, 2) + " s";
    $("ek-ball").textContent = komma((EK_Y0 - pb.y) * 100, 0) + " cm";
    $("ek-lys").textContent = komma((EK_Y0 - pl.y) * 100, 1) + " cm";
    const ekte = 0.5 * g * (EK_B / EK_C) ** 2;
    $("ek-ekte").textContent = g > 0 ? Sim.tall(ekte, 2) + " m" : "0 m";
  }

  function nullstill() { avspiller.stopp(); t = 0; les(); tegn(); }
  for (const k of document.querySelectorAll("[data-ek]")) k.addEventListener("click", () => { scene = k.dataset.ek; nullstill(); });
  for (const id of ["ek-vb", "ek-c"]) $(id).addEventListener("input", nullstill);
  $("ek-nullstill").addEventListener("click", nullstill);
  nullstill();
})();
