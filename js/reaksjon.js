// Reaksjonstid: en test i nettleseren og linjalmetoden (t = √(2s/g)). Resultatene lagres bare i nettleseren.

const G = 9.81;
const linjalTid = (cm) => Math.sqrt(2 * (cm / 100) / G);

function stat(v) {
  const n = v.length;
  if (!n) return null;
  const m = v.reduce((a, b) => a + b, 0) / n;
  const s = n > 1 ? Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)) : NaN;
  return { n, m, s, min: Math.min(...v), max: Math.max(...v), avvik: Math.max(Math.max(...v) - m, m - Math.min(...v)) };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const felt = $("test-felt");
  if (!felt) return;
  const NOKKEL = "lektorbo-reaksjon";
  const lagret = Sim.hent(NOKKEL, { klikk: [], linjal: ["", "", "", "", ""] });
  let klikk = lagret.klikk || [], linjal = lagret.linjal || ["", "", "", "", ""];
  let tilstand = "klar", tidtaker = null, grønnFra = 0;

  const lagre = () => Sim.lagre(NOKKEL, { klikk, linjal });
  const tekst = (t) => { $("test-tekst").textContent = t; };

  function sett(t) {
    tilstand = t;
    felt.dataset.tilstand = t;
  }

  function trykk(e) {
    e.preventDefault();
    if (tilstand === "klar" || tilstand === "resultat" || tilstand === "tidlig") {
      sett("venter"); tekst("Vent til feltet blir blågrønt …");
      tidtaker = setTimeout(() => { sett("grønn"); tekst("Klikk nå!"); grønnFra = performance.now(); }, 1500 + Math.random() * 2500);
    } else if (tilstand === "venter") {
      clearTimeout(tidtaker); sett("tidlig"); tekst("For tidlig! Klikk for å prøve igjen.");
    } else if (tilstand === "grønn") {
      const ms = performance.now() - grønnFra;
      klikk.push(Math.round(ms)); lagre();
      sett("resultat"); tekst(`${Math.round(ms)} ms. Klikk for å prøve igjen.`);
      oppdater();
    }
  }
  felt.addEventListener("pointerdown", trykk);
  felt.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") trykk(e); });

  function skrivStat(prefiks, s, enhet) {
    $(prefiks + "-n").textContent = s ? String(s.n) : "0";
    $(prefiks + "-m").textContent = s ? komma(s.m, 0) + " " + enhet : "–";
    $(prefiks + "-avvik").textContent = s ? komma(s.avvik, 0) + " " + enhet : "–";
    $(prefiks + "-s").textContent = s && isFinite(s.s) ? komma(s.s, 0) + " " + enhet : "–";
  }

  function tegnLinjal() {
    $("linjal-rader").innerHTML = linjal.map((v, i) => {
      const cm = parseFloat(String(v).replace(",", "."));
      return `<tr><th scope="row">${i + 1}</th><td><input data-i="${i}" type="text" inputmode="decimal" value="${String(v).replace(/"/g, "")}" aria-label="Fallhøyde i forsøk ${i + 1} i cm"></td><td id="l-t-${i}">${isFinite(cm) && cm > 0 ? komma(linjalTid(cm) * 1000, 0) : ""}</td></tr>`;
    }).join("");
  }

  function oppdater() {
    skrivStat("k", stat(klikk), "ms");
    $("klikk-liste").textContent = klikk.length ? klikk.slice(-12).join("  ") + " ms" : "Ingen forsøk ennå.";
    const tider = linjal.map((v) => parseFloat(String(v).replace(",", "."))).filter((x) => isFinite(x) && x > 0).map((cm) => linjalTid(cm) * 1000);
    skrivStat("l", stat(tider), "ms");
    linjal.forEach((v, i) => { const cm = parseFloat(String(v).replace(",", ".")); const el = $("l-t-" + i); if (el) el.textContent = isFinite(cm) && cm > 0 ? komma(linjalTid(cm) * 1000, 0) : ""; });
  }

  $("linjal-rader").addEventListener("input", (e) => { const i = e.target.dataset.i; if (i === undefined) return; linjal[Number(i)] = e.target.value; lagre(); oppdater(); });
  $("linjal-ny").addEventListener("click", () => { linjal.push(""); lagre(); tegnLinjal(); oppdater(); });
  $("klikk-slett").addEventListener("click", () => { if (!confirm("Vil du slette forsøkene i nettlesertesten?")) return; klikk = []; lagre(); sett("klar"); tekst("Klikk her for å starte"); oppdater(); });
  $("linjal-slett").addEventListener("click", () => { if (!confirm("Vil du tømme linjaltabellen?")) return; linjal = ["", "", "", "", ""]; lagre(); tegnLinjal(); oppdater(); });
  const somTekst = () => ["metode;forsøk;tid (ms)", ...klikk.map((ms, i) => `nettleser;${i + 1};${ms}`),
    ...linjal.map((v, i) => { const cm = parseFloat(String(v).replace(",", ".")); return isFinite(cm) && cm > 0 ? `linjal;${i + 1};${Math.round(linjalTid(cm) * 1000)}` : null; }).filter(Boolean)].join("\n");
  $("kopier").addEventListener("click", (e) => Sim.kopier(somTekst().replace(/;/g, "\t"), e.currentTarget));
  sett("klar"); tekst("Klikk her for å starte");
  tegnLinjal();
  oppdater();
})();
