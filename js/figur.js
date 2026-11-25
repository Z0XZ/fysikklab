// Figurgenerator for fysikkfigurer. Legg inn klosser, kuler, vogner, underlag, skråplan, trinser, snorer, fjærer,
// kraftpiler, vinkler, mål og tekst, og lagre figuren som SVG (vektor) eller PNG.
// Koordinatene er lerretsenheter. Lerretet er 1000 × 625, og y går nedover som i SVG.
// rot på legemer er grader med klokka (SVG-retning). I panelet vises den som helning mot klokka.
// Piler og vinkelbuer bruker matematisk retning: grader mot klokka fra positiv x-akse.

(function () {
  const app = document.getElementById("fg-app");
  if (!app) return;
  const $ = (id) => document.getElementById(id);
  const svg = $("fg-svg"), innhold = $("fg-innhold"), valgLag = $("fg-valg"), panel = $("fg-egenskaper"), status = $("fg-status");
  const B = 1000, NOKKEL = "fg-figur", LW = 2;
  const FARGER = { svart: "#000000", "rød": "#c62828", "blå": "#1565c0", "grønn": "#2e7d32", oransje: "#e65100", lilla: "#6a1b9a", "grå": "#6b6b6b" };
  const FYLL = { hvit: "#ffffff", "lys grå": "#e4e4e4", "mørk grå": "#a8a8a8", "lys blå": "#d6e6f7", "lys gul": "#fbefc4", "lys rød": "#f6d3d0", ingen: "none" };
  const FONT = "Times New Roman, Times, serif";
  const BLAA = "#1a73e8";

  // ---------- Hjelpefunksjoner ----------
  const rad = (d) => d * Math.PI / 180, grad = (r) => r * 180 / Math.PI;
  const rund = (x, n) => Math.round(x / n) * n;
  const f = (x) => Math.round(x * 100) / 100;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const norm360 = (a) => ((a % 360) + 360) % 360;
  const norm180 = (a) => { a = norm360(a); return a > 180 ? a - 360 : a; };
  const kopi = (o) => JSON.parse(JSON.stringify(o));
  function rotP(x, y, cx, cy, deg) {
    const a = rad(deg), c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  }
  const lok = (e, lx, ly) => rotP(e.x + lx, e.y + ly, e.x, e.y, e.rot || 0);
  const tilLok = (e, p) => { const [x, y] = rotP(p[0], p[1], e.x, e.y, -(e.rot || 0)); return [x - e.x, y - e.y]; };
  const retning = (deg) => [Math.cos(rad(deg)), -Math.sin(rad(deg))];
  const vinkelTil = (dx, dy) => grad(Math.atan2(-dy, dx));
  const farge = (e) => FARGER[e.farge] || "#000000";
  const fyll = (e, red) => { const v = FYLL[e.fyll] || "#ffffff"; return v === "none" && red ? "transparent" : v; };
  const sti = (pts) => "M" + pts.map((p) => f(p[0]) + " " + f(p[1])).join("L");
  const treff = (d, red) => (red ? `<path d="${d}" stroke="transparent" stroke-width="14" fill="none"/>` : "");
  const xy = (p) => ({ x: p[0], y: p[1] });
  const flate = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { a, b, n: [(b[1] - a[1]) / L, -(b[0] - a[0]) / L] }; };

  // ---------- Tekst med senket og hevet skrift ----------
  const GRESK = { alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ", epsilon: "ε", eta: "η", theta: "θ", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", pi: "π", rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ", phi: "φ", varphi: "φ", omega: "ω", Omega: "Ω", perp: "⊥", par: "∥", parallel: "∥", cdot: "·", deg: "°", approx: "≈", times: "×", Rightarrow: "⇒", infty: "∞" };
  function tolk(s, kursiv) {
    s = String(s || "").replace(/\\([A-Za-z]+)/g, (m, n) => GRESK[n] || m);
    const deler = [];
    let i = 0, buf = "", k = kursiv;
    const ut = (niv, t) => { if (t) deler.push({ niv, t, k }); };
    while (i < s.length) {
      const ch = s[i];
      if (ch === "*") { ut(0, buf); buf = ""; k = !k; i++; }
      else if ((ch === "_" || ch === "^") && i + 1 < s.length) {
        ut(0, buf); buf = "";
        const niv = ch === "_" ? -1 : 1;
        let t;
        if (s[i + 1] === "{") { const j = s.indexOf("}", i + 2); t = j < 0 ? s.slice(i + 2) : s.slice(i + 2, j); i = j < 0 ? s.length : j + 1; }
        else { t = s[i + 1]; i += 2; }
        ut(niv, t);
      } else { buf += ch; i++; }
    }
    ut(0, buf);
    return deler;
  }
  const maaler = document.createElement("canvas").getContext("2d");
  function maal(deler, S) {
    let W = 0;
    for (const d of deler) {
      d.S = d.niv ? S * 0.68 : S;
      maaler.font = (d.k ? "italic " : "") + d.S + "px " + FONT;
      d.w = maaler.measureText(d.t).width;
      W += d.w;
    }
    return W;
  }
  function tekstBredde(s, S, kursiv) { return maal(tolk(s, kursiv !== false), S); }
  function tekstSVG(s, x, y, o = {}) {
    const S = o.str || 22, kursiv = o.kursiv !== false, c = o.farge || "#000000";
    const deler = tolk(s, kursiv);
    if (!deler.length) return "";
    const W = maal(deler, S), x0 = x - W / 2, base = y + S * 0.33;
    let ts = "", forrige = 0;
    for (const d of deler) {
      const off = d.niv < 0 ? S * 0.3 : d.niv > 0 ? -S * 0.4 : 0;
      ts += `<tspan dy="${f(off - forrige)}" font-size="${f(d.S)}" font-style="${d.k ? "italic" : "normal"}">${esc(d.t)}</tspan>`;
      forrige = off;
    }
    let ut = `<text x="${f(x0)}" y="${f(base)}" font-family="${FONT}" font-size="${S}" fill="${c}">${ts}</text>`;
    if (o.vektor) {
      const forste = deler[0].niv === 0 ? deler[0] : null, sk = forste && forste.k ? S * 0.1 : 0;
      let w = forste ? forste.w : W;
      if (forste && /[ =]/.test(forste.t.trim())) { maaler.font = (forste.k ? "italic " : "") + forste.S + "px " + FONT; w = maaler.measureText(forste.t.split(/[ =]/)[0]).width; }
      const xa = x0 + sk, xb = Math.max(x0 + w + sk, xa + S * 0.5), ya = base - S * 0.86, hl = S * 0.24;
      ut += `<path d="M${f(xa)} ${f(ya)}H${f(xb - hl * 0.6)}" stroke="${c}" stroke-width="${f(S * 0.06)}" fill="none"/>`;
      ut += `<path d="M${f(xb)} ${f(ya)}L${f(xb - hl)} ${f(ya - hl * 0.42)}L${f(xb - hl)} ${f(ya + hl * 0.42)}Z" fill="${c}"/>`;
    }
    if (o.red) ut = `<rect x="${f(x0 - 3)}" y="${f(y - S * 0.62)}" width="${f(W + 6)}" height="${f(S * 1.24)}" fill="transparent"/>` + ut;
    return ut;
  }

  // ---------- Piler, buer og skravering ----------
  function pil(x1, y1, x2, y2, o = {}) {
    const c = o.farge || "#000000", lw = o.lw || LW, L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 0.5) return "";
    const hodeE = o.hode !== "ingen", hodeS = o.hode === "begge";
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const hl = Math.min(o.hodeL || 8 + 2.4 * lw, L * (hodeS ? 0.5 : 1)), hb = hl * 0.4;
    const hode = (px, py, dx, dy) => `<path d="M${f(px)} ${f(py)}L${f(px - dx * hl - dy * hb)} ${f(py - dy * hl + dx * hb)}L${f(px - dx * hl * 0.82)} ${f(py - dy * hl * 0.82)}L${f(px - dx * hl + dy * hb)} ${f(py - dy * hl - dx * hb)}Z" fill="${c}"/>`;
    const ax = hodeS ? x1 + ux * hl * 0.8 : x1, ay = hodeS ? y1 + uy * hl * 0.8 : y1;
    const bx = hodeE ? x2 - ux * hl * 0.8 : x2, by = hodeE ? y2 - uy * hl * 0.8 : y2;
    let s = "";
    if (Math.hypot(bx - ax, by - ay) > 0.5 && (bx - ax) * ux + (by - ay) * uy > 0) {
      s += `<path d="M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}" stroke="${c}" stroke-width="${lw}" fill="none"${o.stiplet ? ` stroke-dasharray="${f(lw * 3)} ${f(lw * 2.2)}"` : ""}/>`;
    }
    if (hodeE) s += hode(x2, y2, ux, uy);
    if (hodeS) s += hode(x1, y1, -ux, -uy);
    return s;
  }
  function bueSti(cx, cy, R, fra, til) {
    const span = norm360(til - fra);
    if (span < 0.01) return "";
    const [ax, ay] = [cx + R * Math.cos(rad(fra)), cy - R * Math.sin(rad(fra))];
    const [bx, by] = [cx + R * Math.cos(rad(fra + span)), cy - R * Math.sin(rad(fra + span))];
    return `M${f(ax)} ${f(ay)}A${f(R)} ${f(R)} 0 ${span > 180 ? 1 : 0} 0 ${f(bx)} ${f(by)}`;
  }
  // Skraverer på undersiden av linjestykket a→b (venstre mot høyre gir skravering nedover)
  function skravur(a, b, c) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1) return "";
    const dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L, ux = -dy, uy = dx;
    let d = "";
    for (let s = 10; s <= L + 0.1; s += 11) {
      const qx = a[0] + dx * s, qy = a[1] + dy * s;
      d += `M${f(qx)} ${f(qy)}L${f(qx + ux * 10 - dx * 9)} ${f(qy + uy * 10 - dy * 9)}`;
    }
    return `<path d="${d}" stroke="${c}" stroke-width="1.2" fill="none"/>`;
  }
  const strekLinje = (a, b, c, lw) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${c}" stroke-width="${lw}" fill="none" stroke-linecap="square"/>`;

  // ---------- Felles for legemer ----------
  let fig = null, valgt = null, drag = null, hist = [], hpos = -1;
  const finn = (id) => fig.el.find((e) => e.id === id);
  const skjermSkala = () => (svg.getBoundingClientRect().width || B) / B;
  const tol = () => 12 / skjermSkala();

  // Rotasjoner som finnes i figuren, så nye ting kan rettes inn etter dem
  function kjenteRot(utenId) {
    const ut = [0, 90, -90, 180];
    for (const o of fig.el) {
      if (o.id === utenId) continue;
      if (T[o.type].legeme || o.type === "flate" || o.type === "akser") ut.push(o.rot || 0, (o.rot || 0) + 90, (o.rot || 0) - 90);
      if (o.type === "skraaplan") { const r = o.speil ? o.vinkel : -o.vinkel; ut.push(r, r + 90, r - 90); }
    }
    return ut;
  }
  function festRot(a, utenId) {
    if (!fig.fest) return a;
    for (const k of kjenteRot(utenId)) if (Math.abs(norm180(a - k)) < 3) return norm180(k);
    return rund(a, 5);
  }
  const kroppHandtak = (e) => [{ h: "str", p: lok(e, e.b / 2, -e.h / 2) }, { h: "rot", p: lok(e, 0, -e.h / 2 - 30), fra: lok(e, 0, -e.h / 2) }];
  function kroppDra(e, o, h, p) {
    if (h === "rot") { delete e.paa; e.rot = festRot(grad(Math.atan2(p[1] - o.y, p[0] - o.x)) + 90, e.id); return; }
    // Størrelse: midten av bunnen står fast, så legemet blir stående på underlaget
    const bunn = lok(o, 0, o.h / 2), q = rotP(p[0], p[1], bunn[0], bunn[1], -o.rot), lx = q[0] - bunn[0], ly = q[1] - bunn[1];
    e.b = Math.max(10, fig.fest ? rund(2 * Math.abs(lx), 5) : 2 * Math.abs(lx));
    e.h = Math.max(10, fig.fest ? rund(-ly, 5) : -ly);
    const c = rotP(bunn[0], bunn[1] - e.h / 2, bunn[0], bunn[1], o.rot);
    e.x = c[0]; e.y = c[1];
  }
  const kroppAnker = (e, ekstra = 0) => [[e.x, e.y], lok(e, 0, -e.h / 2), lok(e, 0, e.h / 2 + ekstra), lok(e, -e.b / 2, 0), lok(e, e.b / 2, 0),
    lok(e, -e.b / 2, -e.h / 2), lok(e, e.b / 2, -e.h / 2), lok(e, -e.b / 2, e.h / 2), lok(e, e.b / 2, e.h / 2), lok(e, -e.b / 4, e.h / 2 + ekstra), lok(e, e.b / 4, e.h / 2 + ekstra)];
  const iRekt = (e, p) => { const [lx, ly] = tilLok(e, p); return Math.abs(lx) <= e.b / 2 + 2 && Math.abs(ly) <= e.h / 2 + 2; };
  const kroppTekstP = (e) => { const t = e.tekstPos; return t === "venstre" ? lok(e, -e.b / 4, 0) : t === "høyre" ? lok(e, e.b / 4, 0) : t === "over" ? lok(e, 0, -e.h / 2 - 16) : [e.x, e.y]; };
  const rotTr = (e) => (e.rot ? ` transform="rotate(${f(e.rot)} ${f(e.x)} ${f(e.y)})"` : "");

  // ---------- Felt i egenskapspanelet ----------
  const fT = (k, navn, hjelp) => ({ k, navn, t: "tekst", hjelp });
  const fN = (k, navn, step = 1, min = -1e6) => ({ k, navn, t: "tall", step, min });
  const fV = (k, navn, liste) => ({ k, navn, t: "valg", liste });
  const fA = (k, navn) => ({ k, navn, t: "av" });
  const fRot = { k: "rot", navn: "Helning (grader, mot klokka)", t: "tall", step: 1, min: -360, inn: (v) => -v, ut: (v) => -v };
  const fFarge = fV("farge", "Farge", Object.keys(FARGER)), fFyll = fV("fyll", "Fyll", Object.keys(FYLL));
  const fTekstPos = fV("tekstPos", "Plassering av teksten", ["midt", "venstre", "høyre", "over"]);
  const TEKSTHJELP = "F_N gir senket skrift, v^2 hevet, \\alpha gir α og *m* kursiv.";

  // ---------- Elementtypene ----------
  const T = {};
  T.kloss = {
    navn: "Kloss", legeme: true,
    ny: () => ({ b: 100, h: 60, rot: 0, tekst: "m", tekstPos: "midt", fyll: "hvit", farge: "svart" }),
    svg: (e, red) => `<rect x="${f(e.x - e.b / 2)}" y="${f(e.y - e.h / 2)}" width="${f(e.b)}" height="${f(e.h)}" fill="${fyll(e, red)}" stroke="${farge(e)}" stroke-width="${LW}" stroke-linejoin="round"${rotTr(e)}/>` + tekstSVG(e.tekst, ...kroppTekstP(e), { farge: farge(e) }),
    hh: (e) => e.h / 2,
    // En hul kloss (uten fyll) har også et gulv inni, så noe kan stå inne i den (for eksempel i en heis)
    flater: (e) => [flate(lok(e, -e.b / 2, -e.h / 2), lok(e, e.b / 2, -e.h / 2))].concat(e.fyll === "ingen" ? [flate(lok(e, -e.b / 2 + 1, e.h / 2), lok(e, e.b / 2 - 1, e.h / 2))] : []),
    anker: (e) => kroppAnker(e),
    handtak: kroppHandtak, dra: kroppDra, inni: iRekt,
    felt: [fT("tekst", "Tekst", TEKSTHJELP), fTekstPos, fN("b", "Bredde", 5, 10), fN("h", "Høyde", 5, 10), fRot, fFyll, fFarge],
  };
  T.kule = {
    navn: "Kule", legeme: true,
    ny: () => ({ r: 22, rot: 0, tekst: "", fyll: "lys grå", farge: "svart" }),
    svg: (e, red) => `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="${f(e.r)}" fill="${fyll(e, red)}" stroke="${farge(e)}" stroke-width="${LW}"/>` + tekstSVG(e.tekst, e.x, e.y, { farge: farge(e), str: Math.min(22, e.r * 1.1) }),
    hh: (e) => e.r,
    anker: (e) => [[e.x, e.y], [e.x, e.y - e.r], [e.x, e.y + e.r], [e.x - e.r, e.y], [e.x + e.r, e.y], lok(e, 0, e.r)],
    handtak: (e) => [{ h: "str", p: [e.x + e.r * 0.707, e.y - e.r * 0.707] }],
    dra(e, o, h, p) { const r = Math.hypot(p[0] - o.x, p[1] - o.y); e.r = Math.max(3, fig.fest ? Math.round(r) : r); },
    inni: (e, p) => Math.hypot(p[0] - e.x, p[1] - e.y) <= e.r + 2,
    felt: [fT("tekst", "Tekst", TEKSTHJELP), fN("r", "Radius", 1, 3), fFyll, fFarge],
  };
  const hjulR = (e) => e.h * 0.35;
  T.vogn = {
    navn: "Vogn", legeme: true,
    ny: () => ({ b: 120, h: 40, rot: 0, tekst: "", tekstPos: "midt", fyll: "lys blå", farge: "svart" }),
    svg(e, red) {
      const c = farge(e), r = hjulR(e);
      let s = `<g${rotTr(e)}><rect x="${f(e.x - e.b / 2)}" y="${f(e.y - e.h / 2)}" width="${f(e.b)}" height="${f(e.h)}" rx="4" fill="${fyll(e, red)}" stroke="${c}" stroke-width="${LW}"/>`;
      for (const sx of [-1, 1]) {
        const cx = e.x + sx * e.b * 0.3, cy = e.y + e.h / 2 + r * 0.6;
        s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#ffffff" stroke="${c}" stroke-width="${LW}"/><circle cx="${f(cx)}" cy="${f(cy)}" r="2" fill="${c}"/>`;
      }
      return s + "</g>" + tekstSVG(e.tekst, ...kroppTekstP(e), { farge: c });
    },
    hh: (e) => e.h / 2 + hjulR(e) * 1.6,
    flater: (e) => [flate(lok(e, -e.b / 2, -e.h / 2), lok(e, e.b / 2, -e.h / 2))],
    anker: (e) => kroppAnker(e, hjulR(e) * 1.6),
    handtak: kroppHandtak, dra: kroppDra, inni: iRekt,
    felt: [fT("tekst", "Tekst", TEKSTHJELP), fTekstPos, fN("b", "Bredde", 5, 20), fN("h", "Høyde", 5, 10), fRot, fFyll, fFarge],
  };
  T.flate = {
    navn: "Underlag",
    ny: () => ({ b: 400, rot: 0, skravur: true, farge: "svart" }),
    svg(e, red) {
      const c = farge(e), a = lok(e, -e.b / 2, 0), b = lok(e, e.b / 2, 0);
      return treff(sti([a, b]), red) + strekLinje(a, b, c, LW + 0.5) + (e.skravur ? skravur(a, b, c) : "");
    },
    flater: (e) => [flate(lok(e, -e.b / 2, 0), lok(e, e.b / 2, 0))],
    anker: (e) => [lok(e, -e.b / 2, 0), [e.x, e.y], lok(e, e.b / 2, 0)],
    handtak: (e) => [{ h: "ende", p: lok(e, e.b / 2, 0) }],
    dra(e, o, h, p) {
      const dx = p[0] - o.x, dy = p[1] - o.y;
      let L = Math.hypot(dx, dy) * 2;
      if (fig.fest) L = rund(L, 10);
      e.rot = festRot(grad(Math.atan2(dy, dx)), e.id);
      e.b = Math.max(20, L);
    },
    felt: [fN("b", "Lengde", 10, 20), fRot, fA("skravur", "Skravering"), fFarge],
    knapper: [
      { navn: "Gulv", gjor: (e) => { e.rot = 0; } },
      { navn: "Tak", gjor: (e) => { e.rot = 180; } },
      { navn: "Vegg til venstre", gjor: (e) => { e.rot = 90; } },
      { navn: "Vegg til høyre", gjor: (e) => { e.rot = -90; } },
    ],
  };
  T.ellipse = {
    navn: "Ellipse (bane)",
    ny: () => ({ rx: 120, ry: 40, rot: 0, stiplet: true, lw: 1.5, fyll: "ingen", farge: "svart" }),
    svg(e, red) {
      const tr = rotTr(e), geo = `cx="${f(e.x)}" cy="${f(e.y)}" rx="${f(e.rx)}" ry="${f(e.ry)}"${tr}`;
      return (red ? `<ellipse ${geo} fill="none" stroke="transparent" stroke-width="14"/>` : "")
        + `<ellipse ${geo} fill="${FYLL[e.fyll] || "none"}" stroke="${farge(e)}" stroke-width="${e.lw}"${e.stiplet ? ` stroke-dasharray="${f(e.lw * 3)} ${f(e.lw * 2.2)}"` : ""}/>`;
    },
    anker: (e) => [[e.x, e.y], lok(e, e.rx, 0), lok(e, -e.rx, 0), lok(e, 0, -e.ry), lok(e, 0, e.ry)],
    handtak: (e) => [{ h: "rx", p: lok(e, e.rx, 0) }, { h: "ry", p: lok(e, 0, -e.ry) }],
    dra(e, o, h, p) {
      const [lx, ly] = tilLok(o, p), v = Math.abs(h === "rx" ? lx : ly);
      e[h] = Math.max(2, fig.fest ? rund(v, 5) : v);
    },
    felt: [fN("rx", "Halvakse vannrett", 5, 2), fN("ry", "Halvakse loddrett", 5, 2), fRot, fA("stiplet", "Stiplet"), fN("lw", "Tykkelse", 0.5, 0.5), fFyll, fFarge],
  };
  // Bil sett bakfra: karosseri, bakrute og to dekk sett forfra
  const bilMaal = (e) => { const tw = e.b * 0.17, th = e.h * 0.62; return { tw, th, ned: th * 0.6, tx: e.b / 2 - e.b * 0.03 - tw / 2 }; };
  T.bil = {
    navn: "Bil (bakfra)", legeme: true,
    ny: () => ({ b: 180, h: 60, rot: 0, tekst: "", tekstPos: "midt", fyll: "lys blå", farge: "svart" }),
    svg(e, red) {
      const c = farge(e), m = bilMaal(e), bb = e.b / 2, hh = e.h / 2, ch = e.h * 0.72;
      let s = `<g${rotTr(e)}>`;
      for (const sx of [-1, 1]) s += `<rect x="${f(e.x + sx * m.tx - m.tw / 2)}" y="${f(e.y + hh + m.ned - m.th)}" width="${f(m.tw)}" height="${f(m.th)}" rx="3" fill="#3a3a3a" stroke="${c}" stroke-width="1.5"/>`;
      const hytte = [[e.x - bb * 0.84, e.y - hh], [e.x - bb * 0.62, e.y - hh - ch], [e.x + bb * 0.62, e.y - hh - ch], [e.x + bb * 0.84, e.y - hh]];
      s += `<path d="${sti(hytte)}Z" fill="${fyll(e, red)}" stroke="${c}" stroke-width="${LW}" stroke-linejoin="round"/>`;
      const rute = [[e.x - bb * 0.7, e.y - hh - ch * 0.15], [e.x - bb * 0.56, e.y - hh - ch * 0.82], [e.x + bb * 0.56, e.y - hh - ch * 0.82], [e.x + bb * 0.7, e.y - hh - ch * 0.15]];
      s += `<path d="${sti(rute)}Z" fill="#ffffff" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"/>`;
      s += `<rect x="${f(e.x - bb)}" y="${f(e.y - hh)}" width="${f(e.b)}" height="${f(e.h)}" rx="6" fill="${fyll(e, red)}" stroke="${c}" stroke-width="${LW}"/>`;
      for (const sx of [-1, 1]) s += `<rect x="${f(e.x + sx * bb * 0.8 - e.b * 0.07)}" y="${f(e.y - hh * 0.55)}" width="${f(e.b * 0.14)}" height="${f(e.h * 0.22)}" rx="2" fill="none" stroke="${c}" stroke-width="1.2"/>`;
      s += `<rect x="${f(e.x - e.b * 0.12)}" y="${f(e.y + hh * 0.15)}" width="${f(e.b * 0.24)}" height="${f(e.h * 0.2)}" fill="none" stroke="${c}" stroke-width="1"/>`;
      return s + "</g>" + tekstSVG(e.tekst, ...kroppTekstP(e), { farge: c });
    },
    hh: (e) => e.h / 2 + bilMaal(e).ned,
    flater: (e) => [flate(lok(e, -e.b * 0.31, -e.h / 2 - e.h * 0.72), lok(e, e.b * 0.31, -e.h / 2 - e.h * 0.72))],
    anker(e) { const m = bilMaal(e), y = e.h / 2 + m.ned; return kroppAnker(e, m.ned).concat([lok(e, -m.tx, y), lok(e, m.tx, y), lok(e, 0, -e.h / 2 - e.h * 0.72)]); },
    handtak: kroppHandtak, dra: kroppDra, inni: iRekt,
    felt: [fT("tekst", "Tekst", TEKSTHJELP), fTekstPos, fN("b", "Bredde", 5, 40), fN("h", "Høyde på karosseriet", 5, 15), fRot, fFyll, fFarge],
  };

  // Ladninger og elektriske feltlinjer. Feltlinjene regnes ut fra alle ladningene i figuren.
  const ladFyll = (e, red) => (e.fyll === "auto" ? (e.q > 0 ? FYLL["lys rød"] : e.q < 0 ? FYLL["lys blå"] : "#ffffff") : fyll(e, red));
  T.ladning = {
    navn: "Ladning",
    ny: () => ({ r: 22, q: 1, navn: "", fyll: "auto", farge: "svart", lx: 0, ly: 0 }),
    svg(e, red) {
      const c = farge(e), a = e.r * 0.5, lw = Math.max(1.5, e.r * 0.09);
      let tegn = e.q !== 0 ? `M${f(e.x - a)} ${f(e.y)}H${f(e.x + a)}` : "";
      if (e.q > 0) tegn += `M${f(e.x)} ${f(e.y - a)}V${f(e.y + a)}`;
      const [lx, ly] = [e.x + e.r + 18 + (e.lx || 0), e.y - e.r - 6 + (e.ly || 0)];
      return `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="${f(e.r)}" fill="${ladFyll(e, red)}" stroke="${c}" stroke-width="${LW}"/>`
        + (tegn ? `<path d="${tegn}" stroke="${c}" stroke-width="${f(lw)}" fill="none"/>` : "") + tekstSVG(e.navn, lx, ly, { farge: c, red });
    },
    anker: (e) => [[e.x, e.y], [e.x, e.y - e.r], [e.x, e.y + e.r], [e.x - e.r, e.y], [e.x + e.r, e.y]],
    handtak: (e) => [{ h: "str", p: [e.x + e.r * 0.707, e.y + e.r * 0.707] }].concat(e.navn ? [{ h: "etikett", p: [e.x + e.r + 18 + (e.lx || 0), e.y - e.r - 6 + (e.ly || 0)], liten: true }] : []),
    dra(e, o, h, p, d) {
      if (h === "etikett") { e.lx = (o.lx || 0) + d[0]; e.ly = (o.ly || 0) + d[1]; return; }
      const r = Math.hypot(p[0] - o.x, p[1] - o.y); e.r = Math.max(6, fig.fest ? Math.round(r) : r);
    },
    felt: [fN("q", "Ladning (relativ, med fortegn)", 1, -1e6), fT("navn", "Navn", "For eksempel Q_1 eller +q."), fN("r", "Radius", 1, 6), fV("fyll", "Fyll", ["auto"].concat(Object.keys(FYLL))), fFarge],
  };
  function feltLinjer(e) {
    const lad = fig.el.filter((o) => o.type === "ladning" && o.q !== 0);
    if (!lad.length) return [];
    const E = (x, y) => {
      let ex = 0, ey = 0;
      for (const o of lad) { const dx = x - o.x, dy = y - o.y, r2 = dx * dx + dy * dy, r3 = r2 * Math.sqrt(r2) || 1e-9; ex += o.q * dx / r3; ey += o.q * dy / r3; }
      return [ex, ey];
    };
    const inni = (x, y) => lad.find((o) => Math.hypot(x - o.x, y - o.y) < o.r * 0.98);
    const rv = e.rekkevidde ?? 200, x0 = Math.min(...lad.map((o) => o.x)) - rv, x1 = Math.max(...lad.map((o) => o.x)) + rv;
    const y0 = Math.min(...lad.map((o) => o.y)) - rv * 0.75, y1 = Math.max(...lad.map((o) => o.y)) + rv * 0.75;
    const spor = (start, fortegn, fra) => {
      const pts = [start];
      let [x, y] = start, slutt = null;
      for (let i = 0; i < 2500; i++) {
        const [ex, ey] = E(x, y), L = Math.hypot(ex, ey);
        if (L < 1e-14) break;
        x += fortegn * 2.5 * ex / L; y += fortegn * 2.5 * ey / L;
        const tr = inni(x, y);
        if (tr && tr !== fra) { slutt = tr; pts.push([tr.x + (x - tr.x) * tr.r / Math.hypot(x - tr.x, y - tr.y), tr.y + (y - tr.y) * tr.r / Math.hypot(x - tr.x, y - tr.y)]); break; }
        if (x < x0 || x > x1 || y < y0 || y > y1) break;
        if (i % 2 === 1) pts.push([x, y]);
      }
      if (pts[pts.length - 1][0] !== x) pts.push([x, y]);
      return { pts, slutt };
    };
    const linjer = [];
    const harPos = lad.some((o) => o.q > 0);
    for (const o of lad) {
      const n = Math.max(1, Math.round(e.antall * Math.abs(o.q)));
      for (let k = 0; k < n; k++) {
        const v = 2 * Math.PI * (k + 0.5) / n, start = [o.x + Math.cos(v) * o.r, o.y + Math.sin(v) * o.r];
        if (o.q > 0) linjer.push(spor(start, 1, o).pts);
        else {
          const s = spor(start, -1, o);
          if (harPos && s.slutt && s.slutt.q > 0) continue;   // linja er allerede tegnet fra den positive ladningen
          linjer.push(s.pts.reverse());
        }
      }
    }
    return linjer;
  }
  T.feltlinjer = {
    navn: "Elektriske feltlinjer",
    ny: () => ({ antall: 12, rekkevidde: 200, piler: true, lw: 1.3, farge: "svart" }),
    svg(e, red) {
      const c = farge(e), linjer = feltLinjer(e);
      let d = "", hoder = "";
      for (const pts of linjer) {
        if (pts.length < 2) continue;
        d += sti(pts);
        if (!e.piler) continue;
        let L = 0;
        const lengder = [0];
        for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lengder.push(L); }
        const mal = Math.min(L / 2, 110), i = Math.max(1, lengder.findIndex((x) => x >= mal));
        const a = pts[i - 1], b = pts[i], u = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / u, uy = (b[1] - a[1]) / u;
        hoder += pil(b[0] - ux * 10, b[1] - uy * 10, b[0], b[1], { farge: c, lw: e.lw, hodeL: 10 });
      }
      if (!d) return "";
      return treff(d, red) + `<path d="${d}" stroke="${c}" stroke-width="${e.lw}" fill="none" stroke-linejoin="round"/>` + hoder;
    },
    anker: () => [], handtak: () => [],
    felt: [fN("antall", "Linjer per ladningsenhet", 1, 1), fN("rekkevidde", "Rekkevidde utenfor ladningene", 10, 30), fA("piler", "Pilspisser"), fN("lw", "Tykkelse", 0.1, 0.3), fFarge],
  };
  // Magnetfelt: et område med × (inn i arket) eller ⊙ (ut av arket)
  T.bfelt = {
    navn: "Magnetfelt",
    ny: () => ({ b: 300, h: 220, retning: "inn", avstand: 40, ramme: true, farge: "grå" }),
    svg(e, red) {
      const c = farge(e), x0 = e.x - e.b / 2, y0 = e.y - e.h / 2;
      let s = `<rect x="${f(x0)}" y="${f(y0)}" width="${f(e.b)}" height="${f(e.h)}" fill="${red ? "transparent" : "none"}" stroke="${e.ramme ? c : "none"}" stroke-width="1.2"${e.ramme ? ' stroke-dasharray="6 4"' : ""}/>`;
      const n = Math.max(1, Math.round(e.b / e.avstand)), m = Math.max(1, Math.round(e.h / e.avstand)), dx = e.b / n, dy = e.h / m;
      let d = "", prikker = "";
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
        const cx = x0 + dx * (i + 0.5), cy = y0 + dy * (j + 0.5);
        if (e.retning === "inn") d += `M${f(cx - 5)} ${f(cy - 5)}L${f(cx + 5)} ${f(cy + 5)}M${f(cx + 5)} ${f(cy - 5)}L${f(cx - 5)} ${f(cy + 5)}`;
        else { d += `M${f(cx + 6)} ${f(cy)}A6 6 0 1 0 ${f(cx - 6)} ${f(cy)}A6 6 0 1 0 ${f(cx + 6)} ${f(cy)}`; prikker += `<circle cx="${f(cx)}" cy="${f(cy)}" r="2" fill="${c}"/>`; }
      }
      return s + `<path d="${d}" stroke="${c}" stroke-width="1.4" fill="none"/>` + prikker;
    },
    anker: (e) => [[e.x, e.y], [e.x - e.b / 2, e.y - e.h / 2], [e.x + e.b / 2, e.y - e.h / 2], [e.x - e.b / 2, e.y + e.h / 2], [e.x + e.b / 2, e.y + e.h / 2], [e.x - e.b / 2, e.y], [e.x + e.b / 2, e.y], [e.x, e.y - e.h / 2], [e.x, e.y + e.h / 2]],
    handtak: (e) => [{ h: "str", p: [e.x + e.b / 2, e.y + e.h / 2] }],
    dra(e, o, h, p) {
      const b = 2 * Math.abs(p[0] - o.x), hh = 2 * Math.abs(p[1] - o.y);
      e.b = Math.max(20, fig.fest ? rund(b, 10) : b); e.h = Math.max(20, fig.fest ? rund(hh, 10) : hh);
    },
    felt: [fV("retning", "Retning", ["inn", "ut"]), fN("avstand", "Avstand mellom symbolene", 5, 15), fN("b", "Bredde", 10, 20), fN("h", "Høyde", 10, 20), fA("ramme", "Stiplet ramme"), fFarge],
  };
  // Sirkelbue (for eksempel en bane), tegnet mot klokka fra «fra» til «til», med valgfri pilspiss
  const bueEnde = (e, v) => [e.x + e.r * Math.cos(rad(v)), e.y - e.r * Math.sin(rad(v))];
  T.bue = {
    navn: "Sirkelbue (bane)",
    ny: () => ({ r: 80, fra: 0, til: 120, pil: "til", stiplet: false, lw: 1.5, farge: "svart" }),
    svg(e, red) {
      const c = farge(e), d = bueSti(e.x, e.y, e.r, e.fra, e.til);
      if (!d) return "";
      let s = treff(d, red) + `<path d="${d}" stroke="${c}" stroke-width="${e.lw}" fill="none"${e.stiplet ? ` stroke-dasharray="${f(e.lw * 3)} ${f(e.lw * 2.2)}"` : ""}/>`;
      if (e.pil === "til" || e.pil === "fra") {
        const v = e.pil === "til" ? e.til : e.fra, [px, py] = bueEnde(e, v), sg = e.pil === "til" ? 1 : -1;
        const ux = -Math.sin(rad(v)) * sg, uy = -Math.cos(rad(v)) * sg;
        s += pil(px - ux * 2, py - uy * 2, px, py, { farge: c, lw: e.lw });
      }
      return s;
    },
    anker: (e) => [[e.x, e.y], bueEnde(e, e.fra), bueEnde(e, e.til)],
    handtak: (e) => [{ h: "fra", p: bueEnde(e, e.fra) }, { h: "til", p: bueEnde(e, e.til) }],
    dra(e, o, h, p) {
      let a = vinkelTil(p[0] - o.x, p[1] - o.y);
      if (fig.fest) a = rund(a, 5);
      e[h] = norm180(a);
      const r = Math.hypot(p[0] - o.x, p[1] - o.y);
      e.r = Math.max(5, fig.fest ? rund(r, 5) : r);
    },
    felt: [fN("r", "Radius", 5, 5), fN("fra", "Fra (grader)", 5, -360), fN("til", "Til (grader)", 5, -360), fV("pil", "Pilspiss", ["ingen", "til", "fra"]), fA("stiplet", "Stiplet"), fN("lw", "Tykkelse", 0.5, 0.5), fFarge],
  };
  const planP = (e) => { const s = e.speil ? -1 : 1, hy = e.b * Math.tan(rad(e.vinkel)); return [[e.x, e.y], [e.x + s * e.b, e.y], [e.x + s * e.b, e.y - hy]]; };
  T.skraaplan = {
    navn: "Skråplan",
    ny: () => ({ b: 360, vinkel: 30, speil: false, visVinkel: true, vinkelTekst: "\\alpha", skravur: true, fyll: "lys grå", farge: "svart" }),
    svg(e, red) {
      const c = farge(e), [P0, P1, P2] = planP(e);
      let s = `<path d="${sti([P0, P1, P2])}Z" fill="${fyll(e, red)}" stroke="${c}" stroke-width="${LW}" stroke-linejoin="round"/>`;
      if (e.skravur) {
        const v = e.speil ? P1 : P0, h = e.speil ? P0 : P1, a = [v[0] - 20, v[1]], b = [h[0] + 20, h[1]];
        s += strekLinje(a, b, c, LW + 0.5) + skravur(a, b, c);
      }
      if (e.visVinkel) {
        const R = Math.max(20, Math.min(50, e.b * 0.25)), fra = e.speil ? 180 - e.vinkel : 0, til = e.speil ? 180 : e.vinkel;
        s += `<path d="${bueSti(e.x, e.y, R, fra, til)}" stroke="${c}" stroke-width="1.4" fill="none"/>`;
        const [ux, uy] = retning((fra + til) / 2), r2 = R + 16 + Math.max(0, 20 - e.vinkel) * 1.2;
        s += tekstSVG(e.vinkelTekst, e.x + ux * r2, e.y + uy * r2, { farge: c, str: 20 });
      }
      return s;
    },
    flater: (e) => { const [P0, , P2] = planP(e); return [e.speil ? flate(P2, P0) : flate(P0, P2)]; },
    anker: (e) => { const [P0, P1, P2] = planP(e); return [P0, P1, P2, [(P0[0] + P2[0]) / 2, (P0[1] + P2[1]) / 2]]; },
    handtak: (e) => { const [, P1, P2] = planP(e); return [{ h: "topp", p: P2 }, { h: "base", p: P1 }]; },
    dra(e, o, h, p) {
      if (h === "topp") {
        let a = grad(Math.atan2(Math.max(2, o.y - p[1]), o.b));
        a = fig.fest ? Math.round(a) : a;
        e.vinkel = Math.min(80, Math.max(2, a));
      } else {
        let L = (p[0] - o.x) * (o.speil ? -1 : 1);
        e.b = Math.max(40, fig.fest ? rund(L, 10) : L);
      }
    },
    felt: [fN("b", "Grunnlinje", 10, 40), fN("vinkel", "Vinkel (grader)", 1, 1), fA("speil", "Speilvendt (stiger mot venstre)"), fA("visVinkel", "Vis vinkelen"), fT("vinkelTekst", "Navn på vinkelen", "\\alpha gir α, \\theta gir θ."), fA("skravur", "Skravert underlag"), fFyll, fFarge],
  };
  const stangEnde = (e) => { const [ux, uy] = retning(e.retning); return [e.x + ux * e.stang, e.y + uy * e.stang]; };
  T.trinse = {
    navn: "Trinse",
    ny: () => ({ r: 26, oppheng: "tak", stang: 70, retning: 90, farge: "svart" }),
    svg(e, red) {
      const c = farge(e);
      let s = "";
      if (e.oppheng !== "ingen") {
        const [ux, uy] = retning(e.retning), ende = stangEnde(e);
        s += strekLinje([e.x, e.y], ende, c, LW);
        if (e.oppheng === "tak") {
          const dx = uy, dy = -ux, a = [ende[0] - dx * 32, ende[1] - dy * 32], b = [ende[0] + dx * 32, ende[1] + dy * 32];
          s += strekLinje(a, b, c, LW + 0.5) + skravur(a, b, c);
        }
      }
      s += `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="${f(e.r)}" fill="#ffffff" stroke="${c}" stroke-width="${LW}"/>`;
      s += `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="${f(e.r * 0.72)}" fill="none" stroke="${c}" stroke-width="1"/><circle cx="${f(e.x)}" cy="${f(e.y)}" r="3.5" fill="${c}"/>`;
      return s;
    },
    anker: (e) => { const a = [[e.x, e.y], [e.x - e.r, e.y], [e.x + e.r, e.y], [e.x, e.y - e.r], [e.x, e.y + e.r]]; if (e.oppheng !== "ingen") a.push(stangEnde(e)); return a; },
    handtak: (e) => [{ h: "str", p: [e.x + e.r * 0.707, e.y + e.r * 0.707] }].concat(e.oppheng !== "ingen" ? [{ h: "stang", p: stangEnde(e) }] : []),
    dra(e, o, h, p) {
      if (h === "str") { const r = Math.hypot(p[0] - o.x, p[1] - o.y); e.r = Math.max(6, fig.fest ? Math.round(r) : r); return; }
      let q = p;
      if (fig.fest) { const s = festPunkt(p, e.id); q = [s.x, s.y]; if (s.anker) drag.fest = q; }
      const dx = q[0] - o.x, dy = q[1] - o.y;
      let a = vinkelTil(dx, dy), L = Math.hypot(dx, dy);
      if (fig.fest && !drag.fest) { a = rund(a, 5); L = rund(L, 5); }
      e.retning = norm180(a); e.stang = Math.max(e.r + 2, L);
    },
    inni: (e, p) => Math.hypot(p[0] - e.x, p[1] - e.y) <= e.r + 2,
    felt: [fN("r", "Radius", 1, 6), fV("oppheng", "Oppheng", ["tak", "stang", "ingen"]), fN("stang", "Lengde på stanga", 5, 0), fN("retning", "Retning på stanga (grader)", 5, -360), fFarge],
  };
  const punktHandtak = (e) => e.p.map((p, i) => ({ h: "p" + i, p }));
  function punktDra(e, o, h, p) {
    const i = +h.slice(1), q = festPunkt(p, e.id);
    e.p[i] = [q.x, q.y];
    if (!e.festP) e.festP = e.p.map(() => null);
    e.festP[i] = q.anker ? { id: q.id, i: q.i } : null;
    if (q.anker) drag.fest = [q.x, q.y];
  }
  T.snor = {
    navn: "Snor",
    ny: () => ({ p: [[0, -80], [0, 80]], farge: "svart", lw: 1.6 }),
    svg: (e, red) => treff(sti(e.p), red) + `<path d="${sti(e.p)}" stroke="${farge(e)}" stroke-width="${e.lw || 1.6}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
    anker: (e) => e.p,
    handtak: punktHandtak, dra: punktDra,
    felt: [fN("lw", "Tykkelse", 0.2, 0.5), fFarge],
    knapper: [
      { navn: "Legg til knekkpunkt", gjor: (e) => { const n = e.p.length, a = e.p[n - 2], b = e.p[n - 1]; e.p.splice(n - 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); if (e.festP) e.festP.splice(n - 1, 0, null); } },
      { navn: "Fjern knekkpunkt", gjor: (e) => { if (e.p.length > 2) { if (e.festP) e.festP.splice(e.p.length - 2, 1); e.p.splice(e.p.length - 2, 1); } } },
    ],
  };
  function fjaerPunkter(a, b, n, w) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1) return [a, b];
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, px = -uy, py = ux, lead = Math.min(14, L * 0.12), del = (L - 2 * lead) / (2 * n);
    const pts = [a, [a[0] + ux * lead, a[1] + uy * lead]];
    for (let k = 0; k < 2 * n; k++) {
      const s = lead + (k + 0.5) * del, side = k % 2 ? -1 : 1;
      pts.push([a[0] + ux * s + px * side * w / 2, a[1] + uy * s + py * side * w / 2]);
    }
    pts.push([b[0] - ux * lead, b[1] - uy * lead], b);
    return pts;
  }
  T.fjaer = {
    navn: "Fjær",
    ny: () => ({ p: [[-90, 0], [90, 0]], vindinger: 8, bredde: 18, farge: "svart" }),
    svg: (e, red) => treff(sti(e.p), red) + `<path d="${sti(fjaerPunkter(e.p[0], e.p[1], Math.max(1, Math.round(e.vindinger)), e.bredde))}" stroke="${farge(e)}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
    anker: (e) => e.p,
    handtak: punktHandtak, dra: punktDra,
    felt: [fN("vindinger", "Antall vindinger", 1, 1), fN("bredde", "Bredde", 1, 4), fFarge],
  };

  // Kraftpiler og andre vektorer
  const skala = () => fig.skala || 2;
  const kraftSpiss = (e) => { const [ux, uy] = retning(e.vinkel), L = e.F * skala(); return [e.x + ux * L, e.y + uy * L]; };
  const kraftEtikett = (e) => {
    const [ux, uy] = retning(e.vinkel), [tx, ty] = kraftSpiss(e), off = 8 + Math.abs(ux) * tekstBredde(e.navn, 22) / 2 + Math.abs(uy) * 11;
    return [tx + ux * off + (e.lx || 0), ty + uy * off + (e.ly || 0)];
  };
  function storrelseSteg() { for (const s of [0.1, 0.2, 0.5, 1, 2, 5, 10, 20]) if (s * skala() >= 4) return s; return 50; }
  T.kraft = {
    navn: "Kraftpil (vektor)",
    ny: () => ({ F: 40, vinkel: -90, navn: "F", farge: "rød", vektor: false, stiplet: false, punkt: false, lw: 2.5, lx: 0, ly: 0 }),
    svg(e, red) {
      const c = farge(e), [tx, ty] = kraftSpiss(e), [lx, ly] = kraftEtikett(e);
      return treff(sti([[e.x, e.y], [tx, ty]]), red) + pil(e.x, e.y, tx, ty, { farge: c, lw: e.lw, stiplet: e.stiplet })
        + (e.punkt ? `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="${f(1.6 + e.lw * 0.8)}" fill="${c}"/>` : "")
        + tekstSVG(e.navn, lx, ly, { farge: c, vektor: e.vektor, red });
    },
    anker: (e) => [[e.x, e.y], kraftSpiss(e)],
    handtak: (e) => [{ h: "spiss", p: kraftSpiss(e) }].concat(e.navn ? [{ h: "etikett", p: kraftEtikett(e), liten: true }] : []),
    dra(e, o, h, p, d) {
      if (h === "etikett") { e.lx = (o.lx || 0) + d[0]; e.ly = (o.ly || 0) + d[1]; return; }
      const dx = p[0] - o.x, dy = p[1] - o.y, L = Math.hypot(dx, dy);
      let a = vinkelTil(dx, dy);
      if (fig.fest) {
        let best = null;
        for (const k of kjenteRetninger(e)) { const avvik = Math.abs(norm180(a - k.v)); if (avvik < 3 && (!best || avvik < best.avvik)) best = { avvik, ...k }; }
        a = best ? best.v : rund(a, 5);
        if (best && best.tekst) drag.melding = best.tekst;
        if (best && /underlaget/.test(best.tekst)) e.folg = true;
        const st = storrelseSteg();
        let F = Math.max(st, rund(L / skala(), st));
        for (const k of fig.el) {
          if (k.type === "kraft" && k.id !== e.id && Math.abs(k.F * skala() - L) < 5) { F = k.F; drag.melding = (drag.melding ? drag.melding + ", " : "") + "like lang som " + (k.navn || "en annen pil"); break; }
        }
        e.F = F;
      } else e.F = Math.max(0.1, L / skala());
      e.vinkel = norm180(a);
    },
    felt: [fT("navn", "Navn", TEKSTHJELP), fN("F", "Størrelse", 0.5, 0), fN("vinkel", "Retning (grader mot klokka fra x-aksen)", 5, -360), fA("vektor", "Vektorpil over navnet"), fA("stiplet", "Stiplet (komponent)"), fA("punkt", "Prikk i angrepspunktet"), fA("folg", "Retningen følger legemet pila er festet til"), fN("lw", "Tykkelse", 0.5, 0.5), fFarge],
  };
  // Retninger en kraftpil kan rettes inn etter: vinkelrett på og langs underlaget den står på
  function kjenteRetninger(e) {
    const ut = [];
    for (const o of fig.el) {
      if (o.id === e.id) continue;
      if (T[o.type].legeme && T[o.type].inni(o, [e.x, e.y])) {
        const r = -(o.rot || 0);
        ut.push({ v: r + 90, tekst: "vinkelrett på underlaget" }, { v: r - 90, tekst: "vinkelrett på underlaget" }, { v: r, tekst: "parallelt med underlaget" }, { v: r + 180, tekst: "parallelt med underlaget" });
      }
      if (o.type === "snor") {
        for (let i = 0; i < o.p.length; i++) {
          if (Math.hypot(o.p[i][0] - e.x, o.p[i][1] - e.y) > 3) continue;
          for (const j of [i - 1, i + 1]) if (o.p[j]) ut.push({ v: vinkelTil(o.p[j][0] - e.x, o.p[j][1] - e.y), tekst: "langs snora" });
        }
      }
    }
    return ut;
  }
  function dekomponer(e, akse) {
    const a = rad(e.vinkel - akse), komp = [[e.F * Math.cos(a), akse], [e.F * Math.sin(a), akse + 90]];
    const navn = (suff) => {
      if (!e.navn) return "";
      const m = e.navn.match(/^(.*?)_(?:\{([^}]*)\}|(.))$/);
      return m ? `${m[1]}_{${m[2] || m[3]},${suff}}` : `${e.navn}_${suff.length > 1 ? "{" + suff + "}" : suff}`;
    };
    const rett = Math.abs(norm180(akse)) < 0.01;
    const nye = [];
    komp.forEach(([F, v], i) => {
      if (Math.abs(F) < 1e-6) return;
      const k = Object.assign(kopi(e), { id: fig.neste++, F: f(Math.abs(F)), vinkel: norm180(F < 0 ? v + 180 : v), stiplet: true, lx: 0, ly: 0, navn: navn(rett ? (i ? "y" : "x") : (i ? "\\perp" : "\\par")) });
      oppdaterRel(k); fig.el.push(k); nye.push(k);
    });
    return nye;
  }
  // Vinkelbuer
  const vEtikett = (e) => { const m = e.fra + norm360(e.til - e.fra) / 2, [ux, uy] = retning(m), R = e.r + 14; return [e.x + ux * R + (e.lx || 0), e.y + uy * R + (e.ly || 0)]; };
  const vPunkt = (e, v) => { const [ux, uy] = retning(v); return [e.x + ux * e.r, e.y + uy * e.r]; };
  T.vinkel = {
    navn: "Vinkelbue",
    ny: () => ({ r: 40, fra: 0, til: 30, navn: "\\theta", rett: false, farge: "svart", lx: 0, ly: 0 }),
    svg(e, red) {
      const c = farge(e);
      let d;
      if (e.rett) {
        const q = Math.min(e.r * 0.5, 16), [ax, ay] = retning(e.fra), [bx, by] = retning(e.til);
        d = sti([[e.x + ax * q, e.y + ay * q], [e.x + (ax + bx) * q, e.y + (ay + by) * q], [e.x + bx * q, e.y + by * q]]);
      } else d = bueSti(e.x, e.y, e.r, e.fra, e.til);
      if (!d) return "";
      return treff(d, red) + `<path d="${d}" stroke="${c}" stroke-width="1.4" fill="none"/>` + (e.rett ? "" : tekstSVG(e.navn, ...vEtikett(e), { farge: c, str: 20, red }));
    },
    anker: (e) => [[e.x, e.y]],
    handtak: (e) => [{ h: "fra", p: vPunkt(e, e.fra) }, { h: "til", p: vPunkt(e, e.til) }].concat(e.navn && !e.rett ? [{ h: "etikett", p: vEtikett(e), liten: true }] : []),
    dra(e, o, h, p, d) {
      if (h === "etikett") { e.lx = (o.lx || 0) + d[0]; e.ly = (o.ly || 0) + d[1]; return; }
      let a = vinkelTil(p[0] - o.x, p[1] - o.y);
      if (fig.fest) {
        let best = null;
        for (const v of retningerFra([o.x, o.y], e.id)) { const avvik = Math.abs(norm180(a - v)); if (avvik < 4 && (!best || avvik < best.avvik)) best = { avvik, v }; }
        a = best ? best.v : Math.abs(a - rund(a, 5)) <= 2 ? rund(a, 5) : Math.round(a);
        if (best) drag.melding = "Rettet inn etter en linje i figuren";
      }
      e[h] = norm180(a);
      const r = Math.hypot(p[0] - o.x, p[1] - o.y);
      e.r = Math.max(10, fig.fest ? rund(r, 2) : r);
    },
    felt: [fT("navn", "Navn", "\\theta gir θ, \\alpha gir α."), fN("r", "Radius", 2, 6), fN("fra", "Fra (grader)", 1, -360), fN("til", "Til (grader)", 1, -360), fA("rett", "Rett vinkel (firkant)"), fFarge],
  };
  // Retninger fra et punkt langs linjer, piler og kanter i figuren (brukes av vinkelbuene)
  function retningerFra(c, utenId) {
    const ut = [], naer = (q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < 4;
    for (const o of fig.el) {
      if (o.id === utenId) continue;
      if (o.type === "kraft" && naer([o.x, o.y])) ut.push(o.vinkel);
      if (o.p) o.p.forEach((q, i) => { if (!naer(q)) return; for (const j of [i - 1, i + 1]) if (o.p[j]) ut.push(vinkelTil(o.p[j][0] - c[0], o.p[j][1] - c[1])); });
      if (o.type === "skraaplan" && naer([o.x, o.y])) ut.push(o.speil ? 180 : 0, o.speil ? 180 - o.vinkel : o.vinkel);
      if (o.type === "akser" && naer([o.x, o.y])) ut.push(-(o.rot || 0), 90 - (o.rot || 0));
    }
    return ut;
  }
  T.tekst = {
    navn: "Tekst",
    ny: () => ({ tekst: "*m* = 2,0 kg", str: 22, kursiv: false, farge: "svart" }),
    svg: (e, red) => tekstSVG(e.tekst, e.x, e.y, { str: e.str, kursiv: e.kursiv, farge: farge(e), red }),
    anker: () => [], handtak: () => [],
    felt: [fT("tekst", "Tekst", TEKSTHJELP), fN("str", "Skriftstørrelse", 1, 6), fA("kursiv", "Alt i kursiv"), fFarge],
  };
  const mGeo = (e) => {
    const [a, b] = e.p, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    let nx = uy, ny = -ux;
    if (ny > 0.01 || (Math.abs(ny) <= 0.01 && nx < 0)) { nx = -nx; ny = -ny; }
    return { a, b, L, ux, uy, nx, ny };
  };
  const mEtikett = (e) => {
    const g = mGeo(e), W = tekstBredde(e.tekst, 20, e.kursiv), off = 7 + Math.abs(g.nx) * W / 2 + Math.abs(g.ny) * 11;
    return [(g.a[0] + g.b[0]) / 2 + g.nx * off + (e.lx || 0), (g.a[1] + g.b[1]) / 2 + g.ny * off + (e.ly || 0)];
  };
  T.maal = {
    navn: "Mål (avstand)",
    ny: () => ({ p: [[-80, 0], [80, 0]], tekst: "s", kursiv: true, farge: "svart", lx: 0, ly: 0 }),
    svg(e, red) {
      const c = farge(e), g = mGeo(e);
      if (g.L < 2) return "";
      let s = treff(sti(e.p), red) + pil(g.a[0], g.a[1], g.b[0], g.b[1], { farge: c, lw: 1.2, hode: "begge", hodeL: 10 });
      let d = "";
      for (const q of [g.a, g.b]) d += `M${f(q[0] - g.nx * 8)} ${f(q[1] - g.ny * 8)}L${f(q[0] + g.nx * 8)} ${f(q[1] + g.ny * 8)}`;
      s += `<path d="${d}" stroke="${c}" stroke-width="1.2" fill="none"/>`;
      return s + tekstSVG(e.tekst, ...mEtikett(e), { farge: c, kursiv: e.kursiv, str: 20, red });
    },
    anker: (e) => e.p,
    handtak: (e) => punktHandtak(e).concat(e.tekst ? [{ h: "etikett", p: mEtikett(e), liten: true }] : []),
    dra(e, o, h, p, d) { if (h === "etikett") { e.lx = (o.lx || 0) + d[0]; e.ly = (o.ly || 0) + d[1]; } else punktDra(e, o, h, p); },
    felt: [fT("tekst", "Tekst", TEKSTHJELP), fA("kursiv", "Kursiv"), fFarge],
  };
  T.linje = {
    navn: "Linje",
    ny: () => ({ p: [[-80, 0], [80, 0]], stiplet: true, pil: "ingen", lw: 1.5, farge: "svart" }),
    svg: (e, red) => treff(sti(e.p), red) + pil(e.p[0][0], e.p[0][1], e.p[1][0], e.p[1][1], { farge: farge(e), lw: e.lw, stiplet: e.stiplet, hode: e.pil }),
    anker: (e) => e.p,
    handtak: punktHandtak, dra: punktDra,
    felt: [fA("stiplet", "Stiplet"), fV("pil", "Pilspiss", ["ingen", "ende", "begge"]), fN("lw", "Tykkelse", 0.5, 0.5), fFarge],
  };
  T.kurve = {
    navn: "Kurve (bane)",
    ny: () => ({ p: [[-120, 60], [0, -100], [120, 60]], stiplet: true, pil: "ingen", lw: 1.5, farge: "svart" }),
    svg(e, red) {
      const c = farge(e), [a, k, b] = e.p, d = `M${f(a[0])} ${f(a[1])}Q${f(k[0])} ${f(k[1])} ${f(b[0])} ${f(b[1])}`;
      let s = treff(d, red) + `<path d="${d}" stroke="${c}" stroke-width="${e.lw}" fill="none"${e.stiplet ? ` stroke-dasharray="${f(e.lw * 3)} ${f(e.lw * 2.2)}"` : ""}/>`;
      if (e.pil !== "ingen") {
        const L = Math.hypot(b[0] - k[0], b[1] - k[1]) || 1, ux = (b[0] - k[0]) / L, uy = (b[1] - k[1]) / L;
        s += pil(b[0] - ux * 2, b[1] - uy * 2, b[0], b[1], { farge: c, lw: e.lw });
      }
      return s;
    },
    anker: (e) => [e.p[0], e.p[2]],
    handtak: (e) => punktHandtak(e),
    dra: punktDra,
    felt: [fA("stiplet", "Stiplet"), fV("pil", "Pilspiss", ["ingen", "ende"]), fN("lw", "Tykkelse", 0.5, 0.5), fFarge],
  };
  T.punkt = {
    navn: "Punkt",
    ny: () => ({ r: 4, navn: "A", farge: "svart", lx: 16, ly: -14 }),
    svg: (e, red) => `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="${f(e.r)}" fill="${farge(e)}"/>` + (red ? `<circle cx="${f(e.x)}" cy="${f(e.y)}" r="9" fill="transparent"/>` : "") + tekstSVG(e.navn, e.x + e.lx, e.y + e.ly, { farge: farge(e), red }),
    anker: (e) => [[e.x, e.y]],
    handtak: (e) => (e.navn ? [{ h: "etikett", p: [e.x + e.lx, e.y + e.ly], liten: true }] : []),
    dra(e, o, h, p, d) { e.lx = o.lx + d[0]; e.ly = o.ly + d[1]; },
    felt: [fT("navn", "Navn", TEKSTHJELP), fN("r", "Radius", 0.5, 1), fFarge],
  };
  T.akser = {
    navn: "Koordinatakser",
    ny: () => ({ L: 120, rot: 0, xnavn: "x", ynavn: "y", farge: "svart" }),
    svg(e, red) {
      const c = farge(e), xt = lok(e, e.L, 0), yt = lok(e, 0, -e.L);
      return treff(sti([xt, [e.x, e.y], yt]), red) + pil(e.x, e.y, ...xt, { farge: c, lw: 1.5, hodeL: 11 }) + pil(e.x, e.y, ...yt, { farge: c, lw: 1.5, hodeL: 11 })
        + tekstSVG(e.xnavn, ...lok(e, e.L + 14, 0), { farge: c, str: 20 }) + tekstSVG(e.ynavn, ...lok(e, 0, -e.L - 14), { farge: c, str: 20 });
    },
    anker: (e) => [[e.x, e.y], lok(e, e.L, 0), lok(e, 0, -e.L)],
    handtak: (e) => [{ h: "ende", p: lok(e, e.L, 0) }],
    dra(e, o, h, p) {
      const dx = p[0] - o.x, dy = p[1] - o.y, L = Math.hypot(dx, dy);
      e.rot = festRot(grad(Math.atan2(dy, dx)), e.id);
      e.L = Math.max(20, fig.fest ? rund(L, 5) : L);
    },
    felt: [fN("L", "Lengde", 5, 20), fRot, fT("xnavn", "Navn på x-aksen"), fT("ynavn", "Navn på y-aksen"), fFarge],
  };

  // ---------- Festing ----------
  // Et punkt som er festet til et anker på et annet element, husker elementet og nummeret på ankeret: fest = { id, i }
  // (for elementer med flere punkter: festP = [{ id, i } eller null, …]).
  // Et legeme som står på en flate, husker flaten og hvor langt ut på den det står: paa = { id, j, t }.
  // oppdaterFester() flytter alt som er festet hver gang figuren tegnes, så det følger med når noe flyttes, roteres eller skaleres.
  // En kraftpil med folg = true beholder også vinkelen relativt til legemet (relV), for eksempel N vinkelrett på et skråplan.
  const rotAv = (o) => (o.type === "skraaplan" ? (o.speil ? o.vinkel : -o.vinkel) : o.rot || 0);
  const avhengerAv = (o, id) => (o.fest && o.fest.id === id) || (o.paa && o.paa.id === id) || (o.festP || []).some((x) => x && x.id === id);
  function festPunkt(p, utenId) {
    if (!fig.fest) return { x: p[0], y: p[1] };
    let best = null;
    const tl = tol();
    for (const o of fig.el) {
      if (o.id === utenId || avhengerAv(o, utenId)) continue;
      T[o.type].anker(o).forEach((q, i) => {
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d < tl && (!best || d < best.d)) best = { d, q, id: o.id, i };
      });
    }
    if (best) return { x: best.q[0], y: best.q[1], anker: true, id: best.id, i: best.i };
    return { x: rund(p[0], 5), y: rund(p[1], 5) };
  }
  function festTilFlate(e, grense) {
    const hh = T[e.type].hh(e), lim = grense ?? tol() * 1.6;
    let best = null;
    for (const o of fig.el) {
      if (o.id === e.id || !T[o.type].flater || avhengerAv(o, e.id)) continue;
      T[o.type].flater(o).forEach((fl, j) => {
        const { a, b, n } = fl;
        if (n[1] > -0.1) return;
        const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = ((e.x - a[0]) * dx + (e.y - a[1]) * dy) / L2;
        if (t < 0 || t > 1) return;
        const feil = Math.abs((e.x - a[0]) * n[0] + (e.y - a[1]) * n[1] - hh);
        if (feil < lim && (!best || feil < best.feil)) best = { feil, x: a[0] + t * dx + n[0] * hh, y: a[1] + t * dy + n[1] * hh, rot: grad(Math.atan2(dy, dx)), o, j, t };
      });
    }
    return best;
  }
  function paa(kropp, under, t, j = 0) {
    const fl = T[under.type].flater(under)[j], hh = T[kropp.type].hh(kropp), dx = fl.b[0] - fl.a[0], dy = fl.b[1] - fl.a[1];
    kropp.x = fl.a[0] + t * dx + fl.n[0] * hh;
    kropp.y = fl.a[1] + t * dy + fl.n[1] * hh;
    kropp.rot = norm180(grad(Math.atan2(dy, dx)));
    kropp.paa = { id: under.id, j, t };
    return kropp;
  }
  function oppdaterRel(e) {
    if (e.type !== "kraft") return;
    const o = e.fest && finn(e.fest.id);
    e.relV = o ? e.vinkel + rotAv(o) : null;
  }
  function losne(e) { delete e.fest; delete e.paa; if (e.festP) e.festP = e.festP.map(() => null); }
  function oppdaterFester() {
    for (let runde = 0; runde < 8; runde++) {
      let endret = false;
      const sett = (obj, k, v) => { if (!(Math.abs(obj[k] - v) < 1e-6)) { obj[k] = v; endret = true; } };
      for (const e of fig.el) {
        if (e.paa) {
          const o = finn(e.paa.id), fl = o && T[o.type].flater && T[o.type].flater(o)[e.paa.j];
          if (!fl) delete e.paa;
          else {
            const hh = T[e.type].hh(e), dx = fl.b[0] - fl.a[0], dy = fl.b[1] - fl.a[1], t = e.paa.t;
            sett(e, "x", fl.a[0] + t * dx + fl.n[0] * hh); sett(e, "y", fl.a[1] + t * dy + fl.n[1] * hh); sett(e, "rot", norm180(grad(Math.atan2(dy, dx))));
          }
        }
        if (e.fest) {
          const o = finn(e.fest.id), a = o && T[o.type].anker(o)[e.fest.i];
          if (!a) delete e.fest;
          else {
            sett(e, "x", a[0]); sett(e, "y", a[1]);
            if (e.type === "kraft" && e.folg && e.relV != null) sett(e, "vinkel", norm180(e.relV - rotAv(o)));
          }
        }
        if (e.festP) e.festP.forEach((fp, i) => {
          if (!fp || !e.p[i]) return;
          const o = finn(fp.id), a = o && T[o.type].anker(o)[fp.i];
          if (!a) { e.festP[i] = null; return; }
          if (Math.abs(e.p[i][0] - a[0]) > 1e-6 || Math.abs(e.p[i][1] - a[1]) > 1e-6) { e.p[i] = [a[0], a[1]]; endret = true; }
        });
      }
      if (!endret) break;
    }
  }
  // Fester alt som ligger nøyaktig på et anker eller en flate (brukes når en mal bygges)
  function festAlle() {
    const klasse = (o) => (T[o.type].legeme ? 0 : o.type === "punkt" ? 2 : ["kraft", "vinkel", "maal", "linje", "tekst"].includes(o.type) ? 3 : 1);
    const finnAnker = (p, e) => {
      let best = null;
      for (const o of fig.el) {
        // Bare til noe «under» i rekkefølgen legeme → underlag, trinse, snor … → punkt → pil, vinkel, mål og tekst
        const ok = klasse(o) < klasse(e) || (klasse(o) === 1 && klasse(e) === 1);
        if (o.id === e.id || !ok || avhengerAv(o, e.id)) continue;
        T[o.type].anker(o).forEach((q, i) => {
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.5 && (!best || klasse(o) < best.k)) best = { id: o.id, i, k: klasse(o) };
        });
      }
      return best && { id: best.id, i: best.i };
    };
    for (const e of fig.el) {
      if (T[e.type].legeme && !e.paa) { const s = festTilFlate(e, 0.5); if (s) e.paa = { id: s.o.id, j: s.j, t: s.t }; }
      if (e.p) e.festP = e.p.map((q) => finnAnker(q, e));
      else if (!T[e.type].legeme && !e.fest && ["kraft", "punkt", "vinkel", "tekst", "ladning"].includes(e.type)) { const a = finnAnker([e.x, e.y], e); if (a) e.fest = a; }
      oppdaterRel(e);
    }
  }

  // ---------- Legge til, flytte og endre ----------
  function ny(type, props = {}) {
    const e = Object.assign({ id: fig.neste++, type, x: 0, y: 0 }, T[type].ny(), props);
    if (e.p && !props.p) e.p = e.p.map((q) => [q[0] + e.x, q[1] + e.y]);
    fig.el.push(e);
    return e;
  }
  function forskyv(e, dx, dy) {
    if (e.p) e.p = e.p.map((q) => [q[0] + dx, q[1] + dy]);
    else { e.x += dx; e.y += dy; }
  }
  function flytt(e, o, d) {
    drag.fest = null; drag.melding = "";
    if (o.p) {
      let dx = d[0], dy = d[1], q0 = null;
      if (fig.fest) {
        const q = festPunkt([o.p[0][0] + dx, o.p[0][1] + dy], e.id);
        dx = q.x - o.p[0][0]; dy = q.y - o.p[0][1];
        if (q.anker) { drag.fest = [q.x, q.y]; q0 = { id: q.id, i: q.i }; }
      }
      e.p = o.p.map((q) => [q[0] + dx, q[1] + dy]);
      e.festP = e.p.map((q, i) => (i === 0 ? q0 : null));
      return;
    }
    let x = o.x + d[0], y = o.y + d[1];
    delete e.paa; delete e.fest;
    if (fig.fest && T[e.type].legeme) {
      e.x = x; e.y = y; e.rot = o.rot;
      const s = festTilFlate(e);
      if (s) { e.x = s.x; e.y = s.y; e.rot = norm180(s.rot); e.paa = { id: s.o.id, j: s.j, t: s.t }; drag.melding = "Står på " + T[s.o.type].navn.toLowerCase(); }
      else { e.x = rund(x, 5); e.y = rund(y, 5); }
      return;
    }
    if (fig.fest) {
      const q = festPunkt([x, y], e.id);
      x = q.x; y = q.y;
      if (q.anker) { drag.fest = [x, y]; e.fest = { id: q.id, i: q.i }; drag.melding = "Festet til " + T[finn(q.id).type].navn.toLowerCase(); }
    }
    e.x = x; e.y = y;
  }

  // ---------- Tegning i editoren ----------
  function tegnAlt() {
    oppdaterFester();
    innhold.innerHTML = fig.el.map((e) => `<g data-id="${e.id}">${T[e.type].svg(e, true)}</g>`).join("");
    $("fg-rutenett").style.display = fig.rutenett ? "" : "none";
    tegnValg();
  }
  function tegnValg() {
    const sk = 1 / skjermSkala();
    let s = "";
    if (drag && drag.visAnker && fig.fest) {
      for (const o of fig.el) if (o.id !== valgt) for (const q of T[o.type].anker(o)) s += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(2.6 * sk)}" fill="${BLAA}" opacity=".45"/>`;
    }
    const e = finn(valgt);
    if (e) {
      const g = innhold.querySelector(`[data-id="${e.id}"]`);
      if (g) {
        const bb = g.getBBox(), m = 5 * sk;
        s += `<rect x="${f(bb.x - m)}" y="${f(bb.y - m)}" width="${f(bb.width + 2 * m)}" height="${f(bb.height + 2 * m)}" fill="none" stroke="${BLAA}" stroke-width="${f(sk)}" stroke-dasharray="${f(4 * sk)} ${f(3 * sk)}" pointer-events="none"/>`;
      }
      for (const hd of T[e.type].handtak(e)) {
        if (hd.fra) s += `<path d="M${f(hd.fra[0])} ${f(hd.fra[1])}L${f(hd.p[0])} ${f(hd.p[1])}" stroke="${BLAA}" stroke-width="${f(sk)}" pointer-events="none"/>`;
        s += `<circle data-h="${hd.h}" cx="${f(hd.p[0])}" cy="${f(hd.p[1])}" r="${f((hd.liten ? 5 : 7) * sk)}" fill="${hd.liten ? BLAA : "#ffffff"}" fill-opacity="${hd.liten ? 0.35 : 1}" stroke="${BLAA}" stroke-width="${f(2 * sk)}"/>`;
      }
    }
    if (drag && drag.fest) s += `<circle cx="${f(drag.fest[0])}" cy="${f(drag.fest[1])}" r="${f(9 * sk)}" fill="none" stroke="${BLAA}" stroke-width="${f(2 * sk)}" pointer-events="none"/>`;
    valgLag.innerHTML = s;
  }

  // ---------- Egenskapspanelet ----------
  const visTall = (v) => (Number.isFinite(v) ? String(f(v)) : "");
  function visPanel() {
    const e = finn(valgt);
    if (!e && malApen && fig.mal && MALER[fig.mal.k]) { visMalPanel(); return; }
    if (!e) {
      panel.innerHTML = (fig.mal && MALER[fig.mal.k] ? `<div class="fg-knapperad" style="margin:0 0 .8rem"><button type="button" class="knapp liten" data-mal="apne">Endre tallene i malen</button></div>` : "") + `<h3>Ingen ting valgt</h3><p>Klikk på noe i figuren for å endre det, eller legg til noe fra listen.</p>
        <p class="fg-hjelp"><strong>Hurtigtaster:</strong> Delete sletter, piltastene flytter (med Shift 10 steg), Ctrl/Cmd + D dupliserer, Ctrl/Cmd + Z angrer og Esc fjerner valget.</p>`;
      return;
    }
    const t = T[e.type];
    let h = `<h3>${t.navn}</h3>`;
    for (const fe of t.felt) {
      const id = "fg-f-" + fe.k, v = e[fe.k];
      if (fe.t === "tekst") h += `<label for="${id}">${fe.navn}<input id="${id}" data-k="${fe.k}" type="text" value="${esc(v ?? "")}" autocomplete="off" spellcheck="false"></label>${fe.hjelp ? `<span class="fg-hjelp">${esc(fe.hjelp)}</span>` : ""}`;
      else if (fe.t === "tall") h += `<label for="${id}">${fe.navn}<input id="${id}" data-k="${fe.k}" type="number" step="${fe.step}" value="${visTall(fe.ut ? fe.ut(v || 0) : v)}"></label>`;
      else if (fe.t === "valg") h += `<label for="${id}">${fe.navn}<select id="${id}" data-k="${fe.k}">${fe.liste.map((n) => `<option${n === v ? " selected" : ""}>${n}</option>`).join("")}</select></label>`;
      else if (fe.t === "av") h += `<label class="avkrysning" for="${id}"><input id="${id}" data-k="${fe.k}" type="checkbox"${v ? " checked" : ""}>${fe.navn}</label>`;
    }
    if (t.knapper) h += `<div class="fg-knapperad">${t.knapper.map((k, i) => `<button type="button" class="knapp liten lys" data-knapp="${i}">${k.navn}</button>`).join("")}</div>`;
    if (e.type === "kraft") {
      h += `<div class="fg-dekomp"><label for="fg-akse">Dekomponer langs en akse med retning (grader)<input id="fg-akse" type="number" step="1" value="${visTall(standardAkse(e))}"></label>
        <button type="button" class="knapp liten lys" data-gjor="dekomponer">Lag komponenter</button></div>`;
    }
    h += `<div class="fg-knapperad"><button type="button" class="knapp liten lys" data-gjor="dupliser">Dupliser</button><button type="button" class="knapp liten lys" data-gjor="fremst">Fremst</button><button type="button" class="knapp liten lys" data-gjor="bakerst">Bakerst</button><button type="button" class="knapp liten lys" data-gjor="slett">Slett</button></div>`;
    panel.innerHTML = h;
  }
  function oppdaterPanel() {
    const e = finn(valgt);
    if (!e) return;
    for (const inp of panel.querySelectorAll("[data-k]")) {
      if (inp === document.activeElement) continue;
      const fe = T[e.type].felt.find((x) => x.k === inp.dataset.k), v = e[fe.k];
      if (fe.t === "tall") inp.value = visTall(fe.ut ? fe.ut(v || 0) : v);
      else if (fe.t === "av") inp.checked = !!v;
      else inp.value = v ?? "";
    }
  }
  function standardAkse(e) {
    for (const o of fig.el) if (T[o.type].legeme && T[o.type].inni(o, [e.x, e.y])) return norm180(-(o.rot || 0));
    return 0;
  }
  panel.addEventListener("input", (ev) => {
    const vk = ev.target.dataset.vis;
    if (vk != null && fig.mal) {
      fig.mal.v.vis = Object.assign({}, fig.mal.v.vis, { [vk]: ev.target.checked });
      byggMal();
      return;
    }
    const mk = ev.target.dataset.m;
    if (mk && fig.mal) {
      const p = (MALER[fig.mal.k].param || []).find((x) => x.k === mk);
      if (ev.target.type === "checkbox") fig.mal.v[mk] = ev.target.checked;
      else if (ev.target.tagName === "SELECT") fig.mal.v[mk] = ev.target.value;
      else {
        const v = Number(String(ev.target.value).replace(",", "."));
        if (!Number.isFinite(v) || ev.target.value === "") return;
        fig.mal.v[mk] = Math.min(p.max, Math.max(p.min, v));
      }
      byggMal();
      return;
    }
    const e = finn(valgt), k = ev.target.dataset.k;
    if (!e || !k) return;
    const fe = T[e.type].felt.find((x) => x.k === k);
    if (fe.t === "av") e[k] = ev.target.checked;
    else if (fe.t === "tall") {
      const v = Number(String(ev.target.value).replace(",", "."));
      if (!Number.isFinite(v) || ev.target.value === "") return;
      e[k] = Math.max(fe.min, fe.inn ? fe.inn(v) : v);
      if (fe.inn) e[k] = fe.inn(v);
    } else e[k] = ev.target.value;
    if (k === "rot") delete e.paa;
    oppdaterRel(e);
    tegnAlt();
  });
  panel.addEventListener("change", (ev) => {
    if (ev.target.dataset.vis != null) { lagre(); return; }
    if (ev.target.dataset.m) {
      lagre();
      // Har malen fått eller mistet en tallverdi (for eksempel R når μ blir 0), lages avkrysningene på nytt
      const liste = panel.querySelector(".fg-visliste");
      if (fig.mal && JSON.stringify(finnNokler()) !== (liste ? liste.dataset.nokler : "[]")) visMalPanel();
      return;
    } if (ev.target.dataset.k) { lagre(); if (ev.target.tagName === "SELECT") visPanel(); } });
  panel.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (b && (b.dataset.mal === "alle" || b.dataset.mal === "ingen")) {
      const vis = b.dataset.mal === "alle", v = fig.mal.v;
      v.visTall = vis; v.vis = {};
      byggMal(); lagre(); visMalPanel();
      return;
    }
    if (b && b.dataset.mal) { malApen = b.dataset.mal === "apne"; visPanel(); return; }
    const e = finn(valgt);
    if (!b || !e) return;
    if (b.dataset.knapp) { T[e.type].knapper[+b.dataset.knapp].gjor(e); }
    else if (b.dataset.gjor === "dekomponer") {
      const akse = Number(String($("fg-akse").value).replace(",", ".")) || 0;
      const nye = dekomponer(e, akse);
      status.textContent = nye.length ? "Laget " + nye.length + " stiplede komponenter. Dra navnene dit du vil ha dem." : "Pila ligger langs aksen, så den har bare én komponent.";
    }
    else gjor(b.dataset.gjor);
    lagre(); tegnAlt(); visPanel();
  });
  function gjor(hva) {
    const e = finn(valgt);
    if (!e) return;
    const i = fig.el.indexOf(e);
    if (hva === "slett") { fig.el.splice(i, 1); valgt = null; }
    else if (hva === "dupliser") { const k = Object.assign(kopi(e), { id: fig.neste++ }); losne(k); forskyv(k, 20, 20); fig.el.push(k); valgt = k.id; }
    else if (hva === "fremst") { fig.el.splice(i, 1); fig.el.push(e); }
    else if (hva === "bakerst") { fig.el.splice(i, 1); fig.el.unshift(e); }
  }

  // ---------- Mus og berøring ----------
  function svgPunkt(ev) {
    const m = svg.getScreenCTM().inverse(), q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m);
    return [q.x, q.y];
  }
  svg.addEventListener("pointerdown", (ev) => {
    if (ev.button > 0) return;
    const p = svgPunkt(ev), hd = ev.target.closest("[data-h]");
    if (hd && finn(valgt)) {
      drag = { modus: "h", h: hd.dataset.h, orig: kopi(finn(valgt)), start: p, visAnker: true, endret: false };
    } else {
      const g = ev.target.closest("[data-id]");
      if (g) {
        valgt = +g.dataset.id; malApen = false;
        drag = { modus: "flytt", orig: kopi(finn(valgt)), start: p, visAnker: !T[finn(valgt).type].legeme, endret: false };
      } else { valgt = null; drag = null; }
      visPanel();
    }
    if (drag) svg.setPointerCapture(ev.pointerId);
    tegnAlt();
    ev.preventDefault();
  });
  svg.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const p = svgPunkt(ev), d = [p[0] - drag.start[0], p[1] - drag.start[1]], e = finn(valgt);
    if (!e) return;
    if (!drag.endret && Math.hypot(d[0], d[1]) * skjermSkala() < 2) return;
    drag.endret = true;
    const o = drag.orig;
    Object.assign(e, kopi(o));
    if (drag.modus === "flytt") flytt(e, o, d);
    else { drag.fest = null; drag.melding = ""; T[e.type].dra(e, o, drag.h, p, d); }
    oppdaterRel(e);
    status.textContent = drag.melding || "";
    tegnAlt(); oppdaterPanel();
  });
  const slipp = () => {
    if (!drag) return;
    const endret = drag.endret;
    drag = null;
    if (endret) { lagre(); visPanel(); }
    tegnAlt();
  };
  svg.addEventListener("pointerup", slipp);
  svg.addEventListener("pointercancel", slipp);

  document.addEventListener("keydown", (ev) => {
    const mal = ev.target;
    if (mal.closest && mal.closest("input, select, textarea")) return;
    if (!app.contains(document.activeElement) && document.activeElement !== document.body) return;
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === "z") { ev.preventDefault(); ev.shiftKey ? gjorOm() : angre(); return; }
    if (mod && ev.key.toLowerCase() === "y") { ev.preventDefault(); gjorOm(); return; }
    const e = finn(valgt);
    if (!e) return;
    if (ev.key === "Delete" || ev.key === "Backspace") { gjor("slett"); }
    else if (mod && ev.key.toLowerCase() === "d") { gjor("dupliser"); }
    else if (ev.key === "Escape") { valgt = null; }
    else if (ev.key.startsWith("Arrow")) {
      const s = ev.shiftKey ? 10 : 1;
      losne(e);
      forskyv(e, ev.key === "ArrowLeft" ? -s : ev.key === "ArrowRight" ? s : 0, ev.key === "ArrowUp" ? -s : ev.key === "ArrowDown" ? s : 0);
    } else return;
    ev.preventDefault();
    lagre(); tegnAlt(); visPanel();
  });

  // ---------- Angre og lagring ----------
  function lagre() {
    const s = JSON.stringify(fig);
    if (hist[hpos] === s) return;
    hist = hist.slice(0, hpos + 1);
    hist.push(s);
    if (hist.length > 150) hist.shift();
    hpos = hist.length - 1;
    try { localStorage.setItem(NOKKEL, s); } catch (err) { /* lagring er ikke viktig */ }
    oppdaterAngre();
  }
  function oppdaterAngre() { $("fg-angre").disabled = hpos <= 0; $("fg-gjorom").disabled = hpos >= hist.length - 1; }
  function lastInn(s) {
    fig = JSON.parse(s);
    if (!finn(valgt)) valgt = null;
    $("fg-vis-rutenett").checked = !!fig.rutenett;
    $("fg-fest").checked = !!fig.fest;
    $("fg-skala").value = fig.skala;
    try { localStorage.setItem(NOKKEL, s); } catch (err) { /* */ }
    tegnAlt(); visPanel(); oppdaterAngre();
  }
  function angre() { if (hpos > 0) { hpos--; lastInn(hist[hpos]); } }
  function gjorOm() { if (hpos < hist.length - 1) { hpos++; lastInn(hist[hpos]); } }
  $("fg-angre").addEventListener("click", angre);
  $("fg-gjorom").addEventListener("click", gjorOm);

  // ---------- Maler ----------
  // Hver mal har tallverdier (param) som brukes til å regne ut vinkler og krefter. Kreftene regnes i newton,
  // og pillengden per newton velges slik at den største kraften blir 150 enheter lang. Piler som ikke er krefter
  // (fart, akselerasjon, retning) får en fast lengde med pxL.
  const g0 = 9.81;
  const tallTekst = (x) => {
    const a = Math.abs(x);
    if (a !== 0 && (a < 0.01 || a >= 1e5)) { const e = Math.floor(Math.log10(a)); return `${(x / 10 ** e).toPrecision(3)}·10^{${e}}`.replace(".", ",").replace(/-/g, "−"); }
    return (a >= 100 || a === 0 ? String(Math.round(x)) : x.toPrecision(3)).replace(".", ",").replace(/-/g, "−");
  };
  const gittTekst = (x) => String(x).replace(".", ",").replace("-", "−");   // gitte verdier vises slik de ble skrevet inn
  const gradTekst = (x) => String(Math.round(x * 10) / 10).replace(".", ",");
  let mv = {};
  // Hver tallverdi har en nøkkel (navnet). mv.vis[nøkkel] sier om verdien skal stå i figuren, så læreren kan skjule
  // det elevene skal regne ut. Nøklene samles i mvNokler mens malen bygges, og vises som avkrysninger i panelet.
  let mvNokler = [];
  const synligV = (v, k) => { const vis = v.vis || {}; return k in vis ? !!vis[k] : !!v.visTall; };
  const synlig = (k) => { if (!mvNokler.includes(k)) mvNokler.push(k); return synligV(mv, k); };
  const vt = (k, uten, med) => (synlig(k) ? med : uten);
  const gitt = (x, y, deler) => { const t = deler.filter(([k]) => synlig(k)).map(([, t]) => t).join(",  "); if (t) ny("tekst", { x, y, tekst: t, str: 18 }); };
  const nv = (navn, verdi, enhet = "N") => (synlig(navn) ? `${navn} = ${typeof verdi === "string" ? verdi : tallTekst(verdi)} ${enhet}` : navn);
  const vv = (navn, verdi) => (synlig(navn) ? `${navn} = ${gradTekst(verdi)}°` : navn);
  const P = (k, navn, std, step, min, max, enhet = "") => ({ k, navn, std, step, min, max, enhet });
  const PA = (k, navn, std) => ({ k, navn, std, av: true });
  const PV = (k, navn, std, valg) => ({ k, navn, std, valg });
  const kr = (props) => ny("kraft", props);
  function skaler(maksPx = 150) {
    const krefter = fig.el.filter((e) => e.type === "kraft" && e.pxL == null);
    const Fm = Math.max(0, ...krefter.map((e) => e.F));
    fig.skala = Fm > 0 ? +(maksPx / Fm).toPrecision(4) : 2;
    for (const e of fig.el) if (e.type === "kraft" && e.pxL != null) { e.F = +(e.pxL / fig.skala).toPrecision(4); delete e.pxL; }
  }
  const qNavn = (q) => (q > 0 ? "+" : "−") + (Math.abs(q) === 1 ? "" : gradTekst(Math.abs(q))) + "Q";
  function lagLadninger(v, medP) {
    const q1 = v.q1 || 1, q2 = v.q2 || -1, maks = Math.max(Math.abs(q1), Math.abs(q2));
    ny("feltlinjer", { antall: Math.max(4, Math.round(14 / maks)) });
    const a = ny("ladning", { x: 360, y: 320, q: q1, r: 24, navn: qNavn(q1) }), b = ny("ladning", { x: 640, y: 320, q: q2, r: 24, navn: qNavn(q2) });
    if (medP) {
      let ex = 0, ey = 0;
      for (const o of [a, b]) { const dx = 500 - o.x, dy = 200 - o.y, r3 = Math.hypot(dx, dy) ** 3; ex += o.q * dx / r3; ey += o.q * dy / r3; }
      ny("punkt", { x: 500, y: 200, navn: "P", lx: -18, ly: -14 });
      if (Math.hypot(ex, ey) > 0) kr({ x: 500, y: 200, pxL: 60, vinkel: vinkelTil(ex, ey), navn: "E", vektor: true, farge: "blå" });
    }
  }
  const PARTIKLER = { elektron: { m: 9.109e-31, q: -1.602e-19 }, proton: { m: 1.673e-27, q: 1.602e-19 }, alfapartikkel: { m: 6.645e-27, q: 3.204e-19 } };
  const MALER = {
    bord: { navn: "Kloss på bord, med friksjon",
      param: [P("m", "Masse", 2, 0.1, 0.001, 1e6, "kg"), P("F", "Trekkraft F", 10, 1, 0, 1e9, "N"), P("mu", "Friksjonstall μ", 0.3, 0.05, 0, 10)],
      lag(v) {
        const G = v.m * g0, N = G, R = Math.min(v.F, v.mu * N);
        const g = ny("flate", { x: 500, y: 420, b: 760 });
        const k = paa(ny("kloss", { b: 170, h: 100, tekstPos: "venstre" }), g, 0.45);
        gitt(500, 110, [["m", `*m* = ${gittTekst(v.m)} kg`], ["\\mu", `*μ* = ${gittTekst(v.mu)}`]]);
        kr({ x: k.x, y: k.y, F: G, vinkel: -90, navn: nv("G", G) });
        kr({ ...xy(lok(k, k.b / 4, k.h / 2)), F: N, vinkel: 90, navn: nv("N", N), folg: true });
        if (v.F > 0) kr({ ...xy(lok(k, k.b / 2, 0)), F: v.F, vinkel: 0, navn: nv("F", v.F), folg: true });
        if (R > 0) kr({ ...xy(lok(k, -k.b / 4, k.h / 2)), F: R, vinkel: 180, navn: nv("R", R), ly: -16, folg: true });
      } },
    skraaplan: { navn: "Kloss på skråplan, med dekomponert G",
      param: [P("m", "Masse", 2, 0.1, 0.001, 1e6, "kg"), P("alfa", "Vinkel α", 30, 1, 3, 70, "grader"), P("mu", "Friksjonstall μ", 0.4, 0.05, 0, 10), PA("komp", "Vis komponentene av G", true)],
      lag(v) {
        const a = v.alfa, G = v.m * g0, N = G * Math.cos(rad(a)), Gp = G * Math.sin(rad(a)), R = Math.min(Gp, v.mu * N);
        const b = Math.min(700, 380 / Math.tan(rad(a)));
        const p = ny("skraaplan", { x: 500 - b / 2, y: 560, b, vinkel: a, vinkelTekst: vv("\\alpha", a) });
        const k = paa(ny("kloss", { b: 160, h: 92, tekstPos: "høyre" }), p, 0.52);
        gitt(230, 90, [["m", `*m* = ${gittTekst(v.m)} kg`], ["\\mu", `*μ* = ${gittTekst(v.mu)}`]]);
        kr({ x: k.x, y: k.y, F: G, vinkel: -90, navn: nv("G", G) });
        if (v.komp) {
          kr({ x: k.x, y: k.y, F: Gp, vinkel: 180 + a, navn: nv("G_\\par", Gp), stiplet: true, lx: -4, ly: 14, folg: true });
          kr({ x: k.x, y: k.y, F: N, vinkel: a - 90, navn: nv("G_\\perp", N), stiplet: true, lx: vt("G_\\perp", 16, 46), ly: vt("G_\\perp", 0, 10), folg: true });
        }
        kr({ ...xy(lok(k, -k.b / 4, k.h / 2)), F: N, vinkel: 90 + a, navn: nv("N", N), folg: true });
        if (R > 0) kr({ ...xy(lok(k, k.b / 4, k.h / 2)), F: R, vinkel: a, navn: nv("R", R), folg: true, lx: -16 * Math.sin(rad(a)), ly: -16 * Math.cos(rad(a)) });
        if (v.komp) ny("vinkel", { x: k.x, y: k.y, r: 32, fra: -90, til: -90 + a, navn: "\\alpha" });
      } },
    stabel: { navn: "To klosser på hverandre",
      param: [P("m1", "Masse m₁ (nederst)", 4, 0.1, 0.001, 1e6, "kg"), P("m2", "Masse m₂ (øverst)", 1, 0.1, 0.001, 1e6, "kg"), P("F", "Kraft F på m₁", 20, 1, 0, 1e9, "N")],
      lag(v) {
        const g = ny("flate", { x: 500, y: 440, b: 720 });
        const k1 = paa(ny("kloss", { b: 300, h: 100, tekst: "m_1", fyll: "lys grå" }), g, 0.45);
        gitt(500, 160, [["m_1", `*m*_1 = ${gittTekst(v.m1)} kg`], ["m_2", `*m*_2 = ${gittTekst(v.m2)} kg`]]);
        paa(ny("kloss", { b: 140, h: 80, tekst: "m_2" }), k1, 0.5);
        if (v.F > 0) kr({ ...xy(lok(k1, k1.b / 2, 0)), F: v.F, vinkel: 0, navn: nv("F", v.F) });
      } },
    trinse: { navn: "Kloss på bord og lodd over trinse",
      param: [P("m1", "Masse m₁ (på bordet)", 2, 0.1, 0.001, 1e6, "kg"), P("m2", "Masse m₂ (henger)", 1, 0.1, 0.001, 1e6, "kg"), P("mu", "Friksjonstall μ", 0.2, 0.05, 0, 10)],
      lag(v) {
        const a = Math.max(0, (v.m2 * g0 - v.mu * v.m1 * g0) / (v.m1 + v.m2)), S = v.m2 * (g0 - a), G1 = v.m1 * g0, G2 = v.m2 * g0;
        const R = a > 0 ? v.mu * G1 : S;
        const bord = ny("kloss", { x: 340, y: 480, b: 560, h: 240, tekst: "", fyll: "lys grå" });
        const m1 = paa(ny("kloss", { b: 130, h: 80, tekst: "m_1", tekstPos: "venstre" }), bord, 0.42);
        const Rt = 28, hjorne = lok(bord, bord.b / 2, -bord.h / 2);
        const tr = ny("trinse", { x: hjorne[0] + 30, y: m1.y + Rt, r: Rt, oppheng: "stang" });
        tr.retning = vinkelTil(hjorne[0] - tr.x, hjorne[1] - tr.y); tr.stang = Math.hypot(hjorne[0] - tr.x, hjorne[1] - tr.y);
        const m2 = ny("kloss", { x: tr.x + Rt, y: 470, b: 96, h: 90, tekst: "m_2", tekstPos: "venstre" });
        ny("snor", { p: [lok(m1, m1.b / 2, 0), [tr.x, tr.y - Rt]] });
        ny("snor", { p: [[tr.x + Rt, tr.y], [m2.x, m2.y - m2.h / 2]] });
        kr({ x: m1.x, y: m1.y, F: G1, vinkel: -90, navn: nv("G_1", G1) });
        kr({ ...xy(lok(m1, m1.b / 4, m1.h / 2)), F: G1, vinkel: 90, navn: nv("N", G1), lx: 6 });
        kr({ ...xy(lok(m1, m1.b / 2, 0)), F: S, vinkel: 0, navn: nv("S", S), lx: -8, ly: -22 });
        if (R > 0) kr({ ...xy(lok(m1, -m1.b / 4, m1.h / 2)), F: R, vinkel: 180, navn: nv("R", R), ly: -16 });
        kr({ x: m2.x, y: m2.y - m2.h / 2, F: S, vinkel: 90, navn: nv("S", S), lx: vt("S", 20, 52), ly: vt("S", 12, 20) });
        kr({ x: m2.x, y: m2.y, F: G2, vinkel: -90, navn: nv("G_2", G2) });
        gitt(340, 120, [["m_1", `*m*_1 = ${gittTekst(v.m1)} kg`], ["m_2", `*m*_2 = ${gittTekst(v.m2)} kg`], ["\\mu", `*μ* = ${gittTekst(v.mu)}`], ["a", `*a* = ${tallTekst(a)} m/s^2`]]);
      } },
    atwood: { navn: "Atwoods fallmaskin",
      param: [P("m1", "Masse m₁ (venstre)", 3, 0.1, 0.001, 1e6, "kg"), P("m2", "Masse m₂ (høyre)", 2, 0.1, 0.001, 1e6, "kg")],
      lag(v) {
        const G1 = v.m1 * g0, G2 = v.m2 * g0, S = 2 * v.m1 * v.m2 * g0 / (v.m1 + v.m2), a = Math.abs(v.m1 - v.m2) * g0 / (v.m1 + v.m2);
        ny("flate", { x: 500, y: 50, b: 300, rot: 180 });
        const tr = ny("trinse", { x: 500, y: 140, r: 46, oppheng: "stang", stang: 90, retning: 90 });
        const lav = 400, hoy = 300, y1 = v.m1 >= v.m2 ? lav : hoy, y2 = v.m1 >= v.m2 ? hoy : lav;
        const m1 = ny("kloss", { x: tr.x - tr.r, y: y1, b: 84, h: 90, tekst: "m_1", tekstPos: "venstre" });
        const m2 = ny("kloss", { x: tr.x + tr.r, y: y2, b: 84, h: 90, tekst: "m_2", tekstPos: "høyre" });
        ny("snor", { p: [[m1.x, tr.y], [m1.x, m1.y - m1.h / 2]] });
        ny("snor", { p: [[m2.x, tr.y], [m2.x, m2.y - m2.h / 2]] });
        kr({ x: m1.x, y: m1.y, F: G1, vinkel: -90, navn: nv("G_1", G1) });
        kr({ x: m1.x, y: m1.y - m1.h / 2, F: S, vinkel: 90, navn: nv("S", S), lx: vt("S", -22, -56), ly: 10 });
        kr({ x: m2.x, y: m2.y, F: G2, vinkel: -90, navn: nv("G_2", G2) });
        kr({ x: m2.x, y: m2.y - m2.h / 2, F: S, vinkel: 90, navn: nv("S", S), lx: vt("S", 22, 56), ly: 10 });
        gitt(230, 120, [["m_1", `*m*_1 = ${gittTekst(v.m1)} kg`], ["m_2", `*m*_2 = ${gittTekst(v.m2)} kg`], ["a", `*a* = ${tallTekst(a)} m/s^2`]]);
      } },
    fjaer: { navn: "Kloss festet i fjær",
      param: [P("k", "Fjærstivhet k", 50, 1, 0.001, 1e9, "N/m"), P("x", "Forlengelse x (negativ: sammentrykt)", 10, 1, -25, 25, "cm")],
      lag(v) {
        const F = v.k * v.x / 100, xpx = Math.max(-200, Math.min(300, v.x * 12));
        ny("flate", { x: 130, y: 380, b: 220, rot: 90 });
        const g = ny("flate", { x: 480, y: 490, b: 700 });
        const kb = 140, t = (420 + xpx + kb / 2 - 130) / 700;
        const k = paa(ny("kloss", { b: kb, h: 110 }), g, t);
        ny("fjaer", { p: [[130, k.y], lok(k, -k.b / 2, 0)], vindinger: 10, bredde: 24 });
        ny("linje", { p: [[420, 340], [420, 490]] });
        gitt(500, 160, [["k", `*k* = ${gittTekst(v.k)} N/m`]]);
        if (v.x !== 0) ny("maal", { p: [[420, 330], [420 + xpx, 330]], tekst: nv("x", gittTekst(v.x), "cm") });
        if (F !== 0) kr({ ...xy(lok(k, -k.b / 2, -k.h / 4)), F: Math.abs(F), vinkel: F > 0 ? 180 : 0, navn: nv("F", Math.abs(F)), ly: -2 });
      } },
    kast: { navn: "Skrått kast",
      param: [P("v0", "Startfart v₀", 15, 1, 0.1, 1e4, "m/s"), P("theta", "Utgangsvinkel θ", 50, 1, 5, 85, "grader")],
      lag(v) {
        const th = rad(v.theta), Rm = v.v0 ** 2 * Math.sin(2 * th) / g0, Hm = (v.v0 * Math.sin(th)) ** 2 / (2 * g0);
        const sc = Math.min(680 / Rm, 380 / Hm), y0 = 506, x0 = 500 - Rm * sc / 2, xe = x0 + Rm * sc, xm = x0 + Rm * sc / 2;
        ny("flate", { x: 500, y: 520, b: 880 });
        ny("kurve", { p: [[x0, y0], [xm, y0 - 2 * Hm * sc], [xe, y0]] });
        ny("kule", { x: x0, y: y0, r: 14 });
        kr({ x: x0, y: y0, pxL: 110, vinkel: v.theta, navn: nv("v_0", v.v0, "m/s"), farge: "blå", lx: vt("v_0", -32, -70), ly: 0 });
        ny("vinkel", { x: x0, y: y0, r: 50, fra: 0, til: v.theta, navn: vv("\\theta", v.theta), lx: vt("\\theta", 0, 22) });
        ny("maal", { p: [[xm, y0], [xm, y0 - Hm * sc]], tekst: nv("h", Hm, "m") });
        ny("maal", { p: [[x0, 570], [xe, 570]], tekst: nv("s", Rm, "m") });
      } },
    pendel: { navn: "Kule i snor (pendel) i ytterstilling",
      param: [P("m", "Masse", 0.5, 0.1, 0.001, 1e6, "kg"), P("theta", "Utslag θ", 30, 1, 0, 80, "grader")],
      lag(v) {
        const th = v.theta, G = v.m * g0, S = G * Math.cos(rad(th)), L = 330, c = [500 + L * Math.sin(rad(th)), 50 + L * Math.cos(rad(th))];
        ny("flate", { x: 500, y: 50, b: 260, rot: 180 });
        ny("linje", { p: [[500, 50], [500, 420]] });
        ny("snor", { p: [[500, 50], c] });
        if (th > 0) ny("vinkel", { x: 500, y: 50, r: 80, fra: -90, til: -90 + th, navn: vv("\\theta", th), lx: vt("\\theta", 0, 24) });
        ny("kule", { x: c[0], y: c[1], r: 26 });
        gitt(230, 120, [["m", `*m* = ${gittTekst(v.m)} kg`]]);
        kr({ x: c[0], y: c[1], F: G, vinkel: -90, navn: nv("G", G) });
        kr({ x: c[0], y: c[1], F: S, vinkel: 90 + th, navn: nv("S", S), lx: vt("S", 18, 50), ly: 4 });
      } },
    heis: { navn: "Person i heis som akselererer",
      param: [P("m", "Masse", 60, 1, 0.001, 1e6, "kg"), P("a", "Akselerasjon (positiv oppover)", 1.5, 0.1, -9.81, 100, "m/s²")],
      lag(v) {
        const G = v.m * g0, N = Math.max(0, v.m * (g0 + v.a));
        ny("flate", { x: 500, y: 40, b: 260, rot: 180 });
        const h = ny("kloss", { x: 500, y: 330, b: 260, h: 300, tekst: "", fyll: "ingen" });
        ny("snor", { p: [[500, 40], [500, h.y - h.h / 2]] });
        const m = paa(ny("kloss", { b: 90, h: 100, tekstPos: "venstre" }), h, 0.38, 1);
        gitt(190, 120, [["m", `*m* = ${gittTekst(v.m)} kg`]]);
        kr({ x: m.x, y: m.y, F: G, vinkel: -90, navn: nv("G", G), lx: vt("G", 0, -50), ly: vt("G", 0, -12) });
        if (N > 0) kr({ ...xy(lok(m, m.b / 4, m.h / 2)), F: N, vinkel: 90, navn: nv("N", N), lx: vt("N", 14, 40), ly: 8 });
        if (v.a !== 0) kr({ x: h.x + h.b / 2 + 40, y: h.y + (v.a > 0 ? 40 : -40), pxL: 80, vinkel: v.a > 0 ? 90 : -90, navn: nv("a", Math.abs(v.a), "m/s^2"), farge: "blå" });
      } },
    svingFlat: { navn: "Bil i flat sving (sett bakfra)",
      param: [P("m", "Masse", 1200, 10, 0.001, 1e9, "kg"), P("v", "Fart", 15, 1, 0, 1e4, "m/s"), P("r", "Radius i svingen", 50, 1, 0.1, 1e6, "m")],
      lag(v) {
        const G = v.m * g0, R = v.m * v.v ** 2 / v.r;
        const g = ny("flate", { x: 500, y: 460, b: 760 });
        ny("tekst", { x: 180, y: 520, tekst: "mot sentrum av svingen", str: 18 });
        kr({ x: 270, y: 545, pxL: 180, vinkel: 180, navn: "", farge: "svart", lw: 1.5 });
        const b = paa(ny("bil", { b: 200, h: 64 }), g, 0.5), mb = bilMaal(b);
        kr({ x: b.x, y: b.y, F: G, vinkel: -90, navn: nv("G", G) });
        kr({ ...xy(lok(b, mb.tx, T.bil.hh(b))), F: G, vinkel: 90, navn: nv("N", G), lx: 16, ly: 6 });
        if (R > 0) kr({ ...xy(lok(b, -mb.tx, T.bil.hh(b))), F: R, vinkel: 180, navn: nv("R", R), ly: -16 });
        gitt(500, 90, [["m", `*m* = ${gittTekst(v.m)} kg`], ["v", `*v* = ${gittTekst(v.v)} m/s`], ["r", `*r* = ${gittTekst(v.r)} m`]]);
      } },
    svingDosert: { navn: "Bil i dosert sving (sett bakfra)",
      param: [P("m", "Masse", 1200, 10, 0.001, 1e9, "kg"), P("theta", "Doseringsvinkel θ", 20, 1, 1, 60, "grader"), P("r", "Radius i svingen", 80, 1, 0.1, 1e6, "m")],
      lag(v) {
        const a = v.theta, G = v.m * g0, N = G / Math.cos(rad(a)), SF = G * Math.tan(rad(a)), fart = Math.sqrt(v.r * g0 * Math.tan(rad(a)));
        const b = Math.min(760, 300 / Math.tan(rad(a)));
        const p = ny("skraaplan", { x: 500 - b / 2, y: 540, b, vinkel: a, vinkelTekst: vv("\\theta", a) });
        const bil = paa(ny("bil", { b: 150, h: 50 }), p, 0.5);
        const kontakt = lok(bil, bil.b * 0.2, T.bil.hh(bil));
        kr({ x: bil.x, y: bil.y, F: G, vinkel: -90, navn: nv("G", G) });
        kr({ x: kontakt[0], y: kontakt[1], F: N, vinkel: 90 + a, navn: nv("N", N), lx: 4, ly: 2, folg: true });
        ny("linje", { p: [kontakt, [kontakt[0], kontakt[1] - 175]] });
        ny("vinkel", { x: kontakt[0], y: kontakt[1], r: 128, fra: 90, til: 90 + a, navn: "\\theta" });
        kr({ x: bil.x, y: bil.y, F: SF, vinkel: 180, navn: nv("\\Sigma F", SF), stiplet: true, farge: "blå", lx: -32, ly: 0 });
        ny("tekst", { x: 200, y: 140, tekst: "mot sentrum av svingen", str: 18 });
        kr({ x: 290, y: 165, pxL: 180, vinkel: 180, navn: "", farge: "svart", lw: 1.5 });
        gitt(700, 90, [["m", `*m* = ${gittTekst(v.m)} kg`], ["r", `*r* = ${gittTekst(v.r)} m`], ["v", `*v* = ${tallTekst(fart)} m/s`]]);
      } },
    konisk: { navn: "Konisk pendel",
      param: [P("m", "Masse", 0.2, 0.05, 0.001, 1e6, "kg"), P("theta", "Vinkel θ med loddlinja", 30, 1, 3, 75, "grader"), P("L", "Lengde på snora", 0.5, 0.05, 0.01, 1e4, "m")],
      lag(v) {
        const th = v.theta, G = v.m * g0, S = G / Math.cos(rad(th)), SF = G * Math.tan(rad(th));
        const L = Math.min(320, 260 / Math.sin(rad(th))), c = [500 + L * Math.sin(rad(th)), 50 + L * Math.cos(rad(th))];
        ny("flate", { x: 500, y: 50, b: 260, rot: 180 });
        ny("ellipse", { x: 500, y: c[1], rx: c[0] - 500, ry: Math.max(12, (c[0] - 500) * 0.25) });
        ny("linje", { p: [[500, 50], [500, c[1] + 70]] });
        ny("maal", { p: [[500, c[1] + 60], [c[0], c[1] + 60]], tekst: nv("r", v.L * Math.sin(rad(th)), "m") });
        ny("snor", { p: [[500, 50], c] });
        ny("vinkel", { x: 500, y: 50, r: 80, fra: -90, til: -90 + th, navn: vv("\\theta", th), lx: vt("\\theta", 0, 24) });
        ny("kule", { x: c[0], y: c[1], r: 18 });
        gitt(800, 90, [["m", `*m* = ${gittTekst(v.m)} kg`], ["L", `*L* = ${gittTekst(v.L)} m`]]);
        kr({ x: c[0], y: c[1], F: G, vinkel: -90, navn: nv("G", G) });
        kr({ x: c[0], y: c[1], F: S, vinkel: 90 + th, navn: nv("S", S), lx: vt("S", 18, 52), ly: 4 });
        kr({ x: c[0], y: c[1], F: SF, vinkel: 180, navn: nv("\\Sigma F", SF), stiplet: true, farge: "blå", lx: vt("\\Sigma F", 0, -20), ly: vt("\\Sigma F", -16, -34) });
      } },
    efelt: { navn: "Ladd kule i elektrisk felt mellom to plater",
      param: [P("m", "Masse", 2, 0.1, 0.001, 1e6, "g"), P("q", "Ladning (med fortegn)", 50, 1, -1e9, 1e9, "nC"), P("U", "Spenning mellom platene", 5000, 100, 0, 1e9, "V"), P("d", "Avstand mellom platene", 10, 0.5, 0.1, 1e4, "cm")],
      maksPx: 115,
      lag(v) {
        const E = v.U / (v.d / 100), Fe = Math.abs(v.q) * 1e-9 * E, G = v.m / 1000 * g0, th = grad(Math.atan2(Fe, G)), S = Math.hypot(G, Fe);
        const retn = v.q >= 0 ? 1 : -1;   // pluss-plata står til venstre, så en positiv kule dyttes mot høyre
        const xv = 290, xh = 710, yt = 120, yb = 520, opp = 70;
        ny("kloss", { x: xv, y: (yt + yb) / 2, b: 14, h: yb - yt, tekst: "", fyll: "mørk grå" });
        ny("kloss", { x: xh, y: (yt + yb) / 2, b: 14, h: yb - yt, tekst: "", fyll: "mørk grå" });
        ny("tekst", { x: xv, y: yt - 22, tekst: "+", str: 30 });
        ny("tekst", { x: xh, y: yt - 22, tekst: "−", str: 30 });
        ny("flate", { x: 500, y: opp, b: 240, rot: 180 });
        const sinT = Math.sin(rad(th)), L = sinT > 0 ? Math.min(270, 170 / sinT) : 270;
        const c = [500 + retn * L * sinT, opp + L * Math.cos(rad(th))];
        // Feltlinjer midt mellom kula og nabolinjene, så de ikke går gjennom kula
        for (let y = c[1] - 40 - 80 * Math.floor((c[1] - 40 - yt - 15) / 80); y < yb - 10; y += 80) {
          ny("linje", { p: [[xv + 8, y], [xh - 8, y]], stiplet: false, pil: "ende", lw: 1, farge: "grå" });
          fig.el.unshift(fig.el.pop());   // bakerst, så platene og kula tegnes oppå
        }
        ny("linje", { p: [[500, opp], [500, opp + L + 30]] });
        ny("snor", { p: [[500, opp], c] });
        if (th > 0.5) ny("vinkel", { x: 500, y: opp, r: 70, fra: retn > 0 ? -90 : -90 - th, til: retn > 0 ? -90 + th : -90, navn: vv("\\theta", th), lx: vt("\\theta", -14, -44) * retn });
        ny("ladning", { x: c[0], y: c[1], q: retn, r: 14 });
        kr({ x: c[0], y: c[1], F: G, vinkel: -90, navn: nv("G", G) });
        kr({ x: c[0], y: c[1], F: S, vinkel: retn > 0 ? 90 + th : 90 - th, navn: nv("S", S), lx: vt("S", 20, 56) * retn, ly: 4 });
        if (Fe > 0) kr({ x: c[0], y: c[1], F: Fe, vinkel: retn > 0 ? 0 : 180, navn: nv("F_e", Fe), lx: vt("F_e", 4, -14) * retn, ly: vt("F_e", 22, -22) });
        kr({ x: 465, y: 550, pxL: 70, vinkel: 0, navn: nv("E", E, "V/m"), vektor: true, farge: "blå" });
        ny("maal", { p: [[xv + 7, 595], [xh - 7, 595]], tekst: nv("d", gittTekst(v.d), "cm") });
        gitt(500, 25, [["m", `*m* = ${gittTekst(v.m)} g`], ["q", `*q* = ${gittTekst(v.q)} nC`], ["U", `*U* = ${gittTekst(v.U)} V`]]);
      } },
    avboyning: { navn: "Ladd partikkel som avbøyes mellom plater",
      param: [PV("partikkel", "Partikkel", "elektron", ["elektron", "proton", "alfapartikkel"]), P("v0", "Startfart (·10⁶ m/s)", 20, 1, 0.001, 3e2, ""),
        P("U", "Spenning mellom platene", 200, 10, 0, 1e9, "V"), P("d", "Avstand mellom platene", 4, 0.5, 0.01, 1e4, "cm"), P("L", "Lengde på platene", 10, 1, 0.01, 1e4, "cm")],
      lag(v) {
        const pt = PARTIKLER[v.partikkel] || PARTIKLER.elektron, v0 = v.v0 * 1e6, d = v.d / 100, L = v.L / 100;
        const E = v.U / d, Fe = Math.abs(pt.q) * E, a = Fe / pt.m, retn = pt.q > 0 ? 1 : -1;   // øvre plate er +, så E peker nedover
        const yTreff = d / 2, xTreff = a > 0 ? v0 * Math.sqrt(2 * yTreff / a) : Infinity, treffer = xTreff < L;
        const l = treffer ? xTreff : L, t = l / v0, y = 0.5 * a * t * t, vy = a * t, phi = grad(Math.atan2(vy, v0));
        // Platene skaleres slik at L og d får riktig forhold; avbøyningen tegnes i samme målestokk
        const sk = Math.min(540 / L, 300 / d), Lpx = L * sk, dpx = d * sk, x0 = 500 - Lpx / 2, yc = 330, yo = yc - dpx / 2, yu = yc + dpx / 2;
        for (let i = 1; i <= 5; i++) {
          const x = x0 + Lpx * i / 6;
          ny("linje", { p: [[x, yo + 7], [x, yu - 7]], stiplet: false, pil: "ende", lw: 1, farge: "grå" });
        }
        ny("kloss", { x: x0 + Lpx / 2, y: yo, b: Lpx, h: 10, tekst: "", fyll: "mørk grå" });
        ny("kloss", { x: x0 + Lpx / 2, y: yu, b: Lpx, h: 10, tekst: "", fyll: "mørk grå" });
        ny("tekst", { x: x0 + Lpx + 22, y: yo, tekst: "+", str: 28 });
        ny("tekst", { x: x0 + Lpx + 22, y: yu, tekst: "−", str: 28 });
        const xs = Math.max(40, x0 - 190), ende = [x0 + l * sk, yc + retn * y * sk];
        ny("linje", { p: [[xs, yc], [x0, yc]], stiplet: false, lw: 1.5 });
        ny("kurve", { p: [[x0, yc], [x0 + l * sk / 2, yc], ende], stiplet: false, lw: 1.5 });
        ny("linje", { p: [[x0, yc], [Math.max(x0 + Lpx + 60, ende[0] + 60), yc]], stiplet: true, lw: 1 });
        if (!treffer) {
          const rest = Math.min(960, x0 + Lpx + 200) - ende[0], ut = [ende[0] + rest, ende[1] + retn * rest * Math.tan(rad(phi))];
          ny("linje", { p: [ende, ut], stiplet: false, pil: "ende", lw: 1.5 });
          ny("vinkel", { x: ende[0], y: ende[1], r: 60, fra: retn > 0 ? -phi : 0, til: retn > 0 ? 0 : phi, navn: vv("\\phi", phi), lx: vt("\\phi", 12, 44), ly: retn * 14 });
          if (y * sk > 6) ny("maal", { p: [[ende[0] + 4, yc], [ende[0] + 4, ende[1]]].map((q) => [q[0], q[1]]), tekst: nv("y", y * 100, "cm"), lx: 6 });
          ny("linje", { p: [ende, [ende[0] + 120, ende[1]]], stiplet: true, lw: 1 });
        } else {
          ny("punkt", { x: ende[0], y: ende[1], r: 4, navn: "", lx: 0, ly: 0 });
          ny("tekst", { x: Math.max(x0 + 150, ende[0]), y: yc - retn * dpx / 4, tekst: synlig("x") ? `treffer plata etter *x* = ${tallTekst(xTreff * 100)} cm` : "treffer plata", str: 18 });
        }
        ny("ladning", { x: xs + 30, y: yc, q: retn, r: 11 });
        kr({ x: xs + 30, y: yc, pxL: 80, vinkel: 0, navn: nv("v_0", tallTekst(v0), "m/s"), farge: "blå", ly: 22, lx: vt("v_0", -26, -64) });
        const midt = [x0 + l * sk * 0.5, yc + retn * 0.25 * y * sk];
        kr({ x: midt[0], y: midt[1], pxL: 55, vinkel: retn > 0 ? -90 : 90, navn: nv("F_e", Fe), lx: vt("F_e", 16, 82), ly: -retn * 40 });
        // E-pila står på motsatt side av banen, så den ikke kolliderer med φ og y
        const ey = retn > 0 ? yo + 12 : yu - 72;
        kr({ x: x0 + Lpx + 50, y: ey, pxL: 60, vinkel: -90, navn: nv("E", E, "V/m"), vektor: true, farge: "blå", lx: vt("E", 14, 62), ly: -30 });
        ny("maal", { p: [[x0, yo - 32], [x0 + Lpx, yo - 32]], tekst: nv("L", gittTekst(v.L), "cm") });
        ny("maal", { p: [[x0 - 25, yu], [x0 - 25, yo]], tekst: nv("d", gittTekst(v.d), "cm"), lx: vt("d", -36, -82), ly: -22 });
        gitt(500, 60, [["partikkel", v.partikkel], ["U", `*U* = ${gittTekst(v.U)} V`], ["a", `*a* = ${tallTekst(a)} m/s^2`]]);
      } },
    magnetfelt: { navn: "Ladd partikkel i magnetfelt",
      param: [PV("partikkel", "Partikkel", "elektron", ["elektron", "proton", "alfapartikkel"]), P("v", "Fart (·10⁶ m/s)", 2, 0.1, 0.001, 300, ""),
        P("B", "Magnetisk flukstetthet B", 1, 0.1, 0.0001, 1e6, "mT"), PV("retning", "Retning på B", "inn i arket", ["inn i arket", "ut av arket"]), P("W", "Bredde på feltområdet", 4, 0.5, 0.01, 1e4, "cm")],
      lag(v) {
        const pt = PARTIKLER[v.partikkel] || PARTIKLER.elektron, fart = v.v * 1e6, B = v.B / 1000, W = v.W / 100;
        const r = pt.m * fart / (Math.abs(pt.q) * B), F = Math.abs(pt.q) * fart * B, Tp = 2 * Math.PI * pt.m / (Math.abs(pt.q) * B);
        const s = Math.sign(pt.q) * (v.retning === "inn i arket" ? 1 : -1);   // F = qv × B: +1 bøyer banen oppover
        const halv = r <= W, D = halv ? 180 : grad(Math.asin(W / r));
        const ss = halv ? Math.min(440 / W, 205 / r) : 440 / W, Wpx = W * ss, rpx = r * ss;
        const xr0 = 330, yt = 70, yb = 570, yE = s > 0 ? 530 : 110;
        ny("bfelt", { x: xr0 + Wpx / 2, y: (yt + yb) / 2, b: Wpx, h: yb - yt, retning: v.retning === "inn i arket" ? "inn" : "ut", avstand: Math.max(30, Math.min(45, Wpx / 6)) });
        const C = [xr0, yE - s * rpx], start = s > 0 ? -90 : 90, fra = s > 0 ? start : start - D, til = s > 0 ? start + D : start;
        const pkt = (a) => [C[0] + rpx * Math.cos(rad(a)), C[1] - rpx * Math.sin(rad(a))];
        const retn = (a) => (s > 0 ? [-Math.sin(rad(a)), -Math.cos(rad(a))] : [Math.sin(rad(a)), Math.cos(rad(a))]);
        ny("linje", { p: [[xr0 - 210, yE], [xr0, yE]], stiplet: false, lw: 1.5 });
        ny("bue", { x: C[0], y: C[1], r: rpx, fra, til, pil: "ingen", lw: 1.5 });
        const ve = s > 0 ? til : fra, ut = pkt(ve), du = retn(ve);
        ny("linje", { p: [ut, [ut[0] + du[0] * 130, ut[1] + du[1] * 130]], stiplet: false, lw: 1.5, pil: "ende" });
        // Partikkelen før feltet, og et punkt på banen med fart og kraft
        ny("ladning", { x: xr0 - 170, y: yE, q: Math.sign(pt.q), r: 11 });
        kr({ x: xr0 - 170, y: yE, pxL: 70, vinkel: 0, navn: nv("v", tallTekst(fart), "m/s"), farge: "blå", lx: vt("v", -20, -84), ly: 24 * s });
        const andel = halv ? 0.5 : 0.4, vm = s > 0 ? fra + D * andel : til - D * andel, Pm = pkt(vm), dm = retn(vm);
        // Radien måles langs kanten av feltet (fra sentrum til inngangspunktet) når sentrum er med i figuren
        if (halv) {
          ny("punkt", { x: C[0], y: C[1], r: 3, navn: "", lx: 0, ly: 0 });
          ny("maal", { p: [C, [xr0, yE]], tekst: nv("r", r * 100, "cm"), lx: vt("r", -44, -92) });
        }
        ny("ladning", { x: Pm[0], y: Pm[1], q: Math.sign(pt.q), r: 9 });
        kr({ x: Pm[0], y: Pm[1], pxL: 60, vinkel: vinkelTil(dm[0], dm[1]), navn: "v", farge: "blå" });
        kr({ x: Pm[0], y: Pm[1], pxL: 55, vinkel: vinkelTil(C[0] - Pm[0], C[1] - Pm[1]), navn: nv("F_B", F), lx: halv ? vt("F_B", 0, 34) : 0, ly: halv ? -24 * s : 0 });
        ny("tekst", { x: xr0 + Wpx / 2, y: yt - 22, tekst: `${nv("*B*", gittTekst(v.B), "mT")}, ${v.retning}`, str: 18 });
        ny("maal", { p: [[xr0, yb + 25], [xr0 + Wpx, yb + 25]], tekst: nv("d", gittTekst(v.W), "cm") });
        gitt(150, 40, [["partikkel", v.partikkel], ["T", `*T* = ${tallTekst(Tp)} s`]].concat(halv ? [] : [["r", `*r* = ${tallTekst(r * 100)} cm`]]));
      } },
    treKlosser: { navn: "Tre klosser: to henger over trinser på hver side av bordet", maksPx: 100,
      param: [P("m1", "Masse m₁ (henger til venstre)", 2, 0.1, 0.001, 1e6, "kg"), P("m2", "Masse m₂ (på bordet)", 3, 0.1, 0.001, 1e6, "kg"), P("m3", "Masse m₃ (henger til høyre)", 4, 0.1, 0.001, 1e6, "kg"), P("mu", "Friksjonstall μ", 0.2, 0.05, 0, 10)],
      lag(v) {
        const G1 = v.m1 * g0, G2 = v.m2 * g0, G3 = v.m3 * g0, d = Math.sign(v.m3 - v.m1), driv = Math.abs(G3 - G1), Rmaks = v.mu * G2;
        let a = 0, S1 = G1, S2 = G3, R = driv;   // i ro: friksjonen tar opp forskjellen
        if (driv > Rmaks) { a = (driv - Rmaks) / (v.m1 + v.m2 + v.m3); S1 = v.m1 * (g0 + d * a); S2 = v.m3 * (g0 - d * a); R = Rmaks; }
        const bord = ny("kloss", { x: 500, y: 420, b: 520, h: 220, tekst: "", fyll: "lys grå" });
        const m2 = paa(ny("kloss", { b: 120, h: 70, tekst: "m_2", tekstPos: "venstre" }), bord, 0.5);
        const Rt = 26, hjV = lok(bord, -bord.b / 2, -bord.h / 2), hjH = lok(bord, bord.b / 2, -bord.h / 2);
        const trinse = (hj, sx) => {
          const t = ny("trinse", { x: hj[0] + sx * 30, y: m2.y + Rt, r: Rt, oppheng: "stang" });
          t.retning = vinkelTil(hj[0] - t.x, hj[1] - t.y); t.stang = Math.hypot(hj[0] - t.x, hj[1] - t.y);
          return t;
        };
        const trV = trinse(hjV, -1), trH = trinse(hjH, 1);
        const m1 = ny("kloss", { x: trV.x - Rt, y: 430, b: 80, h: 90, tekst: "m_1", tekstPos: "venstre" });
        const m3 = ny("kloss", { x: trH.x + Rt, y: 430, b: 80, h: 90, tekst: "m_3", tekstPos: "høyre" });
        ny("snor", { p: [lok(m2, -m2.b / 2, 0), [trV.x, trV.y - Rt]] });
        ny("snor", { p: [[trV.x - Rt, trV.y], [m1.x, m1.y - m1.h / 2]] });
        ny("snor", { p: [lok(m2, m2.b / 2, 0), [trH.x, trH.y - Rt]] });
        ny("snor", { p: [[trH.x + Rt, trH.y], [m3.x, m3.y - m3.h / 2]] });
        kr({ x: m2.x, y: m2.y, F: G2, vinkel: -90, navn: nv("G_2", G2) });
        kr({ ...xy(lok(m2, m2.b / 4, m2.h / 2)), F: G2, vinkel: 90, navn: nv("N", G2), lx: vt("N", 6, 30) });
        kr({ ...xy(lok(m2, -m2.b / 2, 0)), F: S1, vinkel: 180, navn: nv("S_1", S1), ly: -22 });
        kr({ ...xy(lok(m2, m2.b / 2, 0)), F: S2, vinkel: 0, navn: nv("S_2", S2), ly: -22 });
        if (R > 1e-9 && d !== 0) kr({ ...xy(lok(m2, -d * m2.b / 4, m2.h / 2)), F: R, vinkel: d > 0 ? 180 : 0, navn: nv("R", R), ly: 20 });
        kr({ x: m1.x, y: m1.y - m1.h / 2, F: S1, vinkel: 90, navn: nv("S_1", S1), lx: vt("S_1", -22, -58), ly: 14 });
        kr({ x: m1.x, y: m1.y, F: G1, vinkel: -90, navn: nv("G_1", G1) });
        kr({ x: m3.x, y: m3.y - m3.h / 2, F: S2, vinkel: 90, navn: nv("S_2", S2), lx: vt("S_2", 22, 58), ly: 14 });
        kr({ x: m3.x, y: m3.y, F: G3, vinkel: -90, navn: nv("G_3", G3) });
        gitt(500, 70, [["m_1", `*m*_1 = ${gittTekst(v.m1)} kg`], ["m_2", `*m*_2 = ${gittTekst(v.m2)} kg`], ["m_3", `*m*_3 = ${gittTekst(v.m3)} kg`], ["\\mu", `*μ* = ${gittTekst(v.mu)}`], ["a", `*a* = ${tallTekst(a)} m/s^2`]]);
      } },
    dipol: { navn: "Ladde kuler (+ og −) med feltlinjer",
      param: [P("q1", "Ladning til venstre (i enheter av Q)", 1, 1, -5, 5), P("q2", "Ladning til høyre (i enheter av Q)", -1, 1, -5, 5)],
      lag(v) { lagLadninger(v, true); } },
    likeLadninger: { navn: "To like ladninger med feltlinjer",
      param: [P("q1", "Ladning til venstre (i enheter av Q)", 1, 1, -5, 5), P("q2", "Ladning til høyre (i enheter av Q)", 1, 1, -5, 5)],
      lag(v) { lagLadninger(v, false); } },
    tom: { navn: "Tom figur", lag() {} },
  };
  const malValg = $("fg-mal");
  for (const [k, m] of Object.entries(MALER)) malValg.insertAdjacentHTML("beforeend", `<option value="${k}">${m.navn}</option>`);
  let malApen = false;
  function byggMal() {
    const m = MALER[fig.mal.k];
    fig.el = []; fig.neste = 1; mv = fig.mal.v;
    m.lag(fig.mal.v); skaler(m.maksPx); festAlle();
    valgt = null;
    $("fg-skala").value = fig.skala;
    tegnAlt();
  }
  function brukMal(k) {
    const m = MALER[k], v = { visTall: false };
    for (const p of m.param || []) v[p.k] = p.std;
    fig = { el: [], neste: 1, skala: 2, fest: fig ? fig.fest : true, rutenett: fig ? fig.rutenett : true, mal: m.param ? { k, v } : null };
    if (fig.mal) byggMal(); else { fig.skala = fig.skala || 2; }
    valgt = null; malApen = !!fig.mal;
    lagre(); lastInn(hist[hpos]);
  }
  // Bygger malen på prøve (uten å endre figuren) for å finne hvilke tallverdier den har
  function finnNokler() {
    const lagret = [fig.el, fig.neste];
    fig.el = []; fig.neste = 1; mv = fig.mal.v; mvNokler = [];
    try { MALER[fig.mal.k].lag(fig.mal.v); } finally { [fig.el, fig.neste] = lagret; }
    return mvNokler.slice();
  }
  const navnHTML = (s) => tolk(s, false).map((d) => (d.niv < 0 ? `<sub>${esc(d.t)}</sub>` : d.niv > 0 ? `<sup>${esc(d.t)}</sup>` : `<i>${esc(d.t)}</i>`)).join("");
  function visMalPanel() {
    const m = MALER[fig.mal.k], v = fig.mal.v;
    let h = `<h3>${m.navn}</h3><p>Skriv inn tallene fra oppgaven. Figuren tegnes på nytt med riktige vinkler og riktige forhold mellom kreftene.</p>`;
    for (const p of m.param) {
      const id = "fg-m-" + p.k;
      h += p.valg ? `<label for="${id}">${p.navn}<select id="${id}" data-m="${p.k}">${p.valg.map((o) => `<option${o === v[p.k] ? " selected" : ""}>${o}</option>`).join("")}</select></label>`
        : p.av ? `<label class="avkrysning" for="${id}"><input id="${id}" data-m="${p.k}" type="checkbox"${v[p.k] ? " checked" : ""}>${p.navn}</label>`
        : `<label for="${id}">${p.navn}${p.enhet ? ` (${p.enhet})` : ""}<input id="${id}" data-m="${p.k}" type="number" step="${p.step}" min="${p.min}" max="${p.max}" value="${v[p.k]}"></label>`;
    }
    const nokler = finnNokler();
    if (nokler.length) {
      h += `<h4 class="fg-under">Tallverdier i figuren</h4><p class="fg-hjelp">Kryss av for verdiene som skal stå i figuren. Det elevene skal regne ut, lar du stå uten kryss.</p>`;
      h += `<div class="fg-visliste" data-nokler="${esc(JSON.stringify(nokler))}">${nokler.map((k, i) => `<label class="avkrysning" for="fg-vis-${i}"><input id="fg-vis-${i}" type="checkbox" data-vis="${esc(k)}"${synligV(v, k) ? " checked" : ""}>${navnHTML(k)}</label>`).join("")}</div>`;
      h += `<div class="fg-knapperad"><button type="button" class="knapp liten lys" data-mal="alle">Vis alle</button><button type="button" class="knapp liten lys" data-mal="ingen">Skjul alle</button></div>`;
    }
    h += `<p class="fg-hjelp">Kreftene regnes ut med g = 9,81 m/s². Endringer du har gjort for hånd i figuren, forsvinner når du endrer tallene her.</p>`;
    h += `<div class="fg-knapperad"><button type="button" class="knapp liten" data-mal="ferdig">Ferdig</button></div>`;
    panel.innerHTML = h;
  }
  malValg.addEventListener("change", () => {
    const k = malValg.value;
    malValg.value = "";
    if (!k) return;
    if (fig.el.length && !confirm("Erstatte figuren du har nå med malen? Du kan angre etterpå.")) return;
    brukMal(k);
  });

  // ---------- Legge til fra verktøylinja ----------
  let nyTeller = 0;
  for (const b of app.querySelectorAll("[data-ny]")) {
    b.addEventListener("click", () => {
      const off = (nyTeller++ % 6) * 20;
      const e = ny(b.dataset.ny, { x: 460 + off, y: 280 + off });
      if (e.type === "feltlinjer") { fig.el.pop(); fig.el.unshift(e); }
      if (e.type === "kraft") e.F = +(80 / skala()).toPrecision(2);
      valgt = e.id;
      lagre(); tegnAlt(); visPanel();
      status.textContent = e.type === "feltlinjer" ? (fig.el.some((o) => o.type === "ladning") ? "Feltlinjene følger ladningene når du flytter dem." : "Legg til ladninger, så tegnes feltlinjene.") : e.p ? "Dra endene. De festes til hjørner og kanter på andre ting." : T[e.type].legeme ? "Dra legemet ned på et underlag, et skråplan eller en annen kloss, så legger det seg riktig." : "";
    });
  }

  // ---------- Innstillinger ----------
  $("fg-vis-rutenett").addEventListener("change", (ev) => { fig.rutenett = ev.target.checked; lagre(); tegnAlt(); });
  $("fg-fest").addEventListener("change", (ev) => { fig.fest = ev.target.checked; lagre(); });
  $("fg-skala").addEventListener("input", (ev) => { const v = Number(String(ev.target.value).replace(",", ".")); if (v > 0) { fig.skala = v; tegnAlt(); } });
  $("fg-skala").addEventListener("change", lagre);
  $("fg-svart").addEventListener("click", () => { for (const e of fig.el) e.farge = "svart"; lagre(); tegnAlt(); visPanel(); });
  $("fg-tom").addEventListener("click", () => { if (!fig.el.length || confirm("Slette hele figuren? Du kan angre etterpå.")) brukMal("tom"); });

  // ---------- Eksport ----------
  function eksportSVG() {
    oppdaterFester();
    const hvit = $("fg-hvit").checked, kropp = fig.el.map((e) => T[e.type].svg(e, false)).join("");
    const tmp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tmp.setAttribute("style", "position:absolute;left:-10000px;top:0;width:1000px;height:625px;visibility:hidden");
    tmp.innerHTML = `<g>${kropp}</g>`;
    document.body.appendChild(tmp);
    let bb;
    try { bb = tmp.firstChild.getBBox(); } finally { tmp.remove(); }
    if (!bb || !bb.width) return null;
    const m = 10, x = Math.floor(bb.x - m), y = Math.floor(bb.y - m), w = Math.ceil(bb.width + 2 * m), h = Math.ceil(bb.height + 2 * m);
    const bak = hvit ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>` : "";
    return { tekst: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${bak}${kropp}</svg>`, w, h };
  }
  function lastNed(blob, navn) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = navn;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function lagPNG() {
    return new Promise((ok, feil) => {
      const s = eksportSVG();
      if (!s) { feil(new Error("tom")); return; }
      const sk = Number($("fg-pngskala").value) || 3, img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = Math.round(s.w * sk); c.height = Math.round(s.h * sk);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => (b ? ok(b) : feil(new Error("png"))), "image/png");
      };
      img.onerror = () => feil(new Error("bilde"));
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s.tekst);
    });
  }
  $("fg-last-svg").addEventListener("click", () => {
    const s = eksportSVG();
    if (!s) { status.textContent = "Figuren er tom."; return; }
    lastNed(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + s.tekst], { type: "image/svg+xml" }), "figur.svg");
  });
  $("fg-last-png").addEventListener("click", () => {
    lagPNG().then((b) => lastNed(b, "figur.png")).catch(() => { status.textContent = "Klarte ikke å lage PNG. Er figuren tom?"; });
  });
  $("fg-kopier").addEventListener("click", () => {
    if (!navigator.clipboard || !window.ClipboardItem) { status.textContent = "Nettleseren kan ikke kopiere bilder. Last ned PNG i stedet."; return; }
    navigator.clipboard.write([new ClipboardItem({ "image/png": lagPNG() })])
      .then(() => { status.textContent = "Bildet er kopiert. Lim det inn i Word, OneNote, PowerPoint eller et annet program."; })
      .catch(() => { status.textContent = "Kopieringen ble stoppet av nettleseren. Last ned PNG i stedet."; });
  });
  $("fg-lagre").addEventListener("click", () => lastNed(new Blob([JSON.stringify(fig, null, 1)], { type: "application/json" }), "figur.json"));
  $("fg-apne").addEventListener("click", () => $("fg-fil").click());
  $("fg-fil").addEventListener("change", (ev) => {
    const fil = ev.target.files[0];
    if (!fil) return;
    fil.text().then((t) => {
      const d = JSON.parse(t);
      if (!d || !Array.isArray(d.el) || d.el.some((e) => !T[e.type])) throw new Error("format");
      fig = d; valgt = null; lagre(); lastInn(hist[hpos]);
      status.textContent = "Åpnet " + fil.name + ".";
    }).catch(() => { status.textContent = "Filen er ikke en figur fra figurgeneratoren."; });
    ev.target.value = "";
  });

  window.addEventListener("resize", () => tegnValg());

  // ---------- Start ----------
  let lagret = null;
  try { lagret = localStorage.getItem(NOKKEL); } catch (err) { /* */ }
  try {
    const d = lagret && JSON.parse(lagret);
    if (d && Array.isArray(d.el) && d.el.every((e) => T[e.type])) { fig = d; lagre(); lastInn(hist[hpos]); }
    else throw new Error("ingen");
  } catch (err) { fig = null; brukMal("skraaplan"); }
})();
