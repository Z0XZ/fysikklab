// Enhetstrener: tilfeldige oppgaver om prefikser, km/h og m/s, standardform, gjeldende siffer, areal, volum og tetthet.

const PREFIKS = [["G", 9], ["M", 6], ["k", 3], ["c", -2], ["m", -3], ["µ", -6], ["n", -9]];
const tilfeldig = (liste) => liste[Math.floor(Math.random() * liste.length)];
const heltall = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// Leser svar som 3,5 · 10^-4, 3.5e-4, 3,5*10^(-4), 0,00035 eller −2
function lesSvar(tekst) {
  let s = String(tekst).trim().replace(/\s+/g, "").replace(/,/g, ".").replace(/[−–]/g, "-").replace(/[·×x*]/g, "*").replace(/[()]/g, "");
  const hevet = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (t) => "^" + hevet[t]).replace(/\^\^/g, "^").replace(/\^(-?)\^/g, "^$1");
  let m = s.match(/^(-?[\d.]+)\*?10\^(-?\d+)$/);
  if (m) return Number(m[1]) * 10 ** Number(m[2]);
  m = s.match(/^10\^(-?\d+)$/);
  if (m) return 10 ** Number(m[1]);
  if (/^-?[\d.]+(e-?\d+)?$/i.test(s)) return Number(s);
  return NaN;
}

// Tall på norsk med komma, uten unødige nuller
function norsk(x) {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const d = Math.max(0, Math.min(12, 3 - e));
  return Number(x.toFixed(d)).toString().replace(".", ",").replace("-", "−");
}
function standardform(x) {
  const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  return norsk(Number(m.toPrecision(3))) + " · 10" + String(e).split("").map((t) => (t === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[t])).join("");
}
const hevet = (e) => String(e).split("").map((t) => (t === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[t])).join("");
// Tall i standardform skrevet med n gjeldende siffer, for oppgavetekst
function siffer(m, n) { return Number(m.toPrecision(n)); }

const GENERATORER = {
  prefiks() {
    const enhet = tilfeldig(["m", "g", "s", "W", "J"]);
    const [p, e] = tilfeldig(enhet === "g" ? [["m", -3], ["µ", -6], ["M", 6]] : PREFIKS.filter(([q]) => q !== "c"));
    const v = siffer(heltall(11, 950) / 10, 2);
    const svar = enhet === "g" ? v * 10 ** (e - 3) : v * 10 ** e;
    const mål = enhet === "g" ? "kg" : enhet;
    return { tekst: `${norsk(v)} ${p}${enhet} = ? ${mål}`, svar, løsning: `${p} betyr 10${hevet(e)}. ${enhet === "g" ? "1 g = 10⁻³ kg, så svaret blir " : "Svaret blir "}${standardform(svar)} ${mål}.` };
  },
  fart() {
    if (Math.random() < 0.5) {
      const v = heltall(3, 24) * 5;
      return { tekst: `${v} km/h = ? m/s`, svar: v / 3.6, løsning: `Del på 3,6: ${v} / 3,6 = ${norsk(v / 3.6)} m/s. (1 km/h = 1000 m / 3600 s.)` };
    }
    const v = heltall(2, 40);
    return { tekst: `${v} m/s = ? km/h`, svar: v * 3.6, løsning: `Gang med 3,6: ${v} · 3,6 = ${norsk(v * 3.6)} km/h.` };
  },
  standardform() {
    const e = tilfeldig([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 8]), m = siffer(heltall(11, 99) / 10, 2), x = m * 10 ** e;
    const vanlig = Math.abs(e) <= 6 ? x.toFixed(Math.max(0, -e + 1)).replace(".", ",") : null;
    if (vanlig && Math.random() < 0.6) return { tekst: `Skriv ${vanlig.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")} på standardform.`, svar: x, løsning: `${standardform(x)}. Flytt kommaet til etter det første sifferet som ikke er null, og tell hvor mange plasser det flyttes.`, standard: true };
    const a = siffer(heltall(11, 90) / 10, 2), b = siffer(heltall(11, 90) / 10, 2), ea = tilfeldig([-5, -4, -3, -2, -1, 1, 2, 3, 4, 6]), eb = tilfeldig([-6, -4, -3, -2, -1, 1, 2, 3, 5]);
    const gange = Math.random() < 0.5;
    const svar = gange ? a * 10 ** ea * b * 10 ** eb : a * 10 ** ea / (b * 10 ** eb);
    return { tekst: `Regn ut ${standardform(a * 10 ** ea)} ${gange ? "·" : "/"} ${standardform(b * 10 ** eb)}`, svar, løsning: `${gange ? "Gang tallene og legg sammen eksponentene" : "Del tallene og trekk fra eksponentene"}: ${standardform(svar)}.`, standard: true };
  },
  siffer() {
    const valg = [["0,0450", 3], ["2,30", 3], ["105", 3], ["0,007", 1], ["9,81", 3], ["3,00 · 10⁸", 3], ["1,602 · 10⁻¹⁹", 4], ["0,50", 2], ["12,0", 3], ["4,0 · 10³", 2], ["0,1010", 4], ["6,67 · 10⁻¹¹", 3]];
    const [t, n] = tilfeldig(valg);
    return { tekst: `Hvor mange gjeldende siffer har ${t}?`, svar: n, heltall: true, løsning: `${n}. Nuller foran det første sifferet som ikke er null, teller ikke. Nuller bak komma til slutt teller.` };
  },
  areal() {
    const valg = [
      () => { const v = heltall(2, 90) * 10; return { tekst: `${v} cm² = ? m²`, svar: v * 1e-4, løsning: `1 cm² = (10⁻² m)² = 10⁻⁴ m², så svaret er ${standardform(v * 1e-4)} m².` }; },
      () => { const v = heltall(2, 90) * 5; return { tekst: `${v} mm² = ? m²`, svar: v * 1e-6, løsning: `1 mm² = (10⁻³ m)² = 10⁻⁶ m², så svaret er ${standardform(v * 1e-6)} m².` }; },
      () => { const v = heltall(2, 99) * 10; return { tekst: `${v} cm³ = ? m³`, svar: v * 1e-6, løsning: `1 cm³ = (10⁻² m)³ = 10⁻⁶ m³, så svaret er ${standardform(v * 1e-6)} m³.` }; },
      () => { const v = heltall(2, 30) / 2; return { tekst: `${norsk(v)} L = ? m³`, svar: v * 1e-3, løsning: `1 L = 1 dm³ = 10⁻³ m³, så svaret er ${standardform(v * 1e-3)} m³.` }; },
      () => { const v = tilfeldig([0.92, 1.0, 2.7, 7.87, 11.3, 19.3, 0.79, 1.26]); return { tekst: `Tettheten er ${norsk(v)} g/cm³. Hva er den i kg/m³?`, svar: v * 1000, løsning: `1 g/cm³ = 10⁻³ kg / 10⁻⁶ m³ = 1000 kg/m³, så svaret er ${norsk(v * 1000)} kg/m³.` }; },
    ];
    return tilfeldig(valg)();
  },
};

function riktig(oppgave, svar) {
  if (!isFinite(svar)) return false;
  if (oppgave.heltall) return svar === oppgave.svar;
  return Math.abs(svar - oppgave.svar) <= Math.abs(oppgave.svar) * 0.006;
}

(function () {
  const $ = Sim.$;
  const felt = $("svar");
  if (!felt) return;
  let oppgave = null, poeng = 0, antall = 0, besvart = false;

  function ny() {
    const type = Sim.verdi("type");
    const typer = type === "alle" ? Object.keys(GENERATORER) : [type];
    oppgave = GENERATORER[tilfeldig(typer)]();
    besvart = false;
    $("oppgave").textContent = oppgave.tekst;
    $("tilbakemelding").textContent = "";
    $("tilbakemelding").className = "melding";
    felt.value = "";
    felt.focus({ preventScroll: true });
  }

  function sjekk() {
    if (!oppgave || besvart) return;
    const svar = lesSvar(felt.value);
    if (!isFinite(svar)) { $("tilbakemelding").textContent = "Jeg forstod ikke svaret. Skriv for eksempel 3,5 · 10^-4 eller 0,00035."; return; }
    besvart = true; antall++;
    const ok = riktig(oppgave, svar);
    if (ok) poeng++;
    $("tilbakemelding").textContent = (ok ? "Riktig! " : "Ikke helt. ") + oppgave.løsning;
    $("tilbakemelding").className = "melding " + (ok ? "riktig" : "feil");
    $("poeng").textContent = `${poeng} av ${antall} riktige`;
  }

  $("sjekk").addEventListener("click", sjekk);
  $("neste").addEventListener("click", ny);
  felt.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); besvart ? ny() : sjekk(); } });
  $("type").addEventListener("input", ny);
  $("poeng").textContent = "0 av 0 riktige";
  ny();
})();
