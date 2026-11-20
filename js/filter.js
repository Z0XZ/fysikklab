// Filter øverst på oversiktssidene (simuleringer, undervisningsopplegg og programmering).
// Leser strukturen som allerede står på siden, så uten JavaScript vises alt som før:
//   <div class="tema-blokk"><h2>Fysikk 1 · Krefter</h2> <ul class="sim-kort-liste"><li>…</li></ul> </div>
// Faget hentes fra «Fysikk 1 · » / «Fysikk 2 · » i overskriften (eller fra <h1 class="kurs-tittel f1"> hvis siden bare har ett fag).
// Blokker uten fag (for eksempel «Til læreren») vises alltid når ingen tema er valgt.
// Et kort kan høre til flere temaer med data-tema="Elektriske felt og krefter|Magnetiske felt og krefter",
// og til begge fagene med data-fag="begge".
// Faget er det samme valget som i nedfallsmenyen øverst (window.Fag i js/tema.js), så det følger med fra side til side.
// Valgene står også i adressen (?fag=f2&tema=sirkelbevegelse&sok=mobil), så en filtrert side kan deles som lenke.

(function () {
  const blokker = [...document.querySelectorAll(".tema-blokk")];
  if (blokker.length < 2) return;
  const kurs = document.querySelector("h1.kurs-tittel");
  const sideFag = kurs ? (kurs.classList.contains("f2") ? "f2" : "f1") : null;
  const FAGNAVN = { f1: "Fysikk 1", f2: "Fysikk 2" };
  const slug = (t) => t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const normal = (t) => t.toLowerCase().replace(/\s+/g, " ");

  // ---------- Les blokker og kort ----------
  const temaer = [];   // { navn, fag, id }
  const kort = [];     // { li, blokk, fag, tema: [id], tekst }
  const info = blokker.map((b) => {
    const h2 = b.querySelector("h2");
    const tekst = h2 ? h2.textContent.trim() : "";
    const m = tekst.match(/^Fysikk ([12]) · (.+)$/);
    const fag = m ? "f" + m[1] : sideFag && tekst ? sideFag : null;
    const navn = m ? m[2] : sideFag ? tekst : null;
    const generell = !fag;
    if (navn && !temaer.some((t) => t.id === slug(navn) && t.fag === fag)) temaer.push({ navn, fag, id: slug(navn) });
    for (const li of b.querySelectorAll(".sim-kort-liste > li")) {
      const egne = (li.dataset.tema || "").split("|").map((s) => s.trim()).filter(Boolean);
      kort.push({ li, blokk: b, fag: li.dataset.fag === "begge" ? null : fag, tema: egne.length ? egne.map(slug) : navn ? [slug(navn)] : [], tekst: normal(li.textContent) });
    }
    return { b, fag, generell };
  });
  const fagFinnes = new Set(info.map((x) => x.fag).filter(Boolean));
  const visFag = !sideFag && fagFinnes.size > 1;

  // ---------- Bygg filteret ----------
  const ramme = document.createElement("div");
  ramme.className = "filter";
  ramme.setAttribute("role", "search");
  ramme.setAttribute("aria-label", "Filtrer innholdet på siden");
  ramme.innerHTML =
    (visFag ? `<div class="filter-rad" role="group" aria-label="Fag"><span class="filter-etikett">Fag</span><button type="button" class="filter-knapp" data-fag="">Alle</button>${[...fagFinnes].sort().map((f) => `<button type="button" class="filter-knapp ${f}" data-fag="${f}">${FAGNAVN[f]}</button>`).join("")}<span class="filter-merknad">Valget huskes på alle sidene og kan også endres i menyen øverst.</span></div>` : "") +
    `<div class="filter-rad" role="group" aria-label="Tema"><span class="filter-etikett">Tema</span><button type="button" class="filter-knapp" data-tema="">Alle</button>${temaer.map((t) => `<button type="button" class="filter-knapp ${t.fag || ""}" data-tema="${t.id}" data-temafag="${t.fag || ""}">${t.navn}</button>`).join("")}</div>` +
    `<div class="filter-rad"><label class="filter-etikett" for="filter-sok">Søk</label><input id="filter-sok" class="filter-sok" type="search" placeholder="For eksempel friksjon, mobil eller Python" autocomplete="off"><span class="filter-antall" aria-live="polite"></span></div>`;
  blokker[0].parentNode.insertBefore(ramme, blokker[0]);
  const sok = ramme.querySelector("#filter-sok");
  const antall = ramme.querySelector(".filter-antall");
  const tom = document.createElement("p");
  tom.className = "filter-tom";
  tom.hidden = true;
  tom.innerHTML = 'Ingenting passer med filteret. <button type="button" class="filter-knapp">Vis alt</button>';
  blokker[blokker.length - 1].after(tom);

  // ---------- Tilstand ----------
  const q = new URLSearchParams(location.search);
  const globaltFag = () => { const f = window.Fag ? window.Fag.hent() : q.get("fag"); return visFag && fagFinnes.has(f) ? f : ""; };
  let valgt = { fag: globaltFag(), tema: q.get("tema") || "", sok: q.get("sok") || "" };
  if (valgt.tema && !temaer.some((t) => t.id === valgt.tema)) valgt.tema = "";
  // En lenke til et tema i det andre faget (for eksempel fra brødsmulestien på en simulering) bytter faget
  const lenketTema = temaer.filter((t) => t.id === valgt.tema);
  if (lenketTema.length && valgt.fag && !lenketTema.some((t) => !t.fag || t.fag === valgt.fag)) {
    valgt.fag = lenketTema[0].fag;
    if (window.Fag) window.Fag.sett(valgt.fag);
  }
  sok.value = valgt.sok;

  function oppdater() {
    // Tema som ikke hører til valgt fag, skjules i lista
    for (const k of ramme.querySelectorAll("[data-tema]")) {
      if (k.dataset.tema) k.hidden = !!(valgt.fag && k.dataset.temafag && k.dataset.temafag !== valgt.fag);
      k.setAttribute("aria-pressed", String(k.dataset.tema === valgt.tema));
    }
    for (const k of ramme.querySelectorAll("[data-fag]")) k.setAttribute("aria-pressed", String(k.dataset.fag === valgt.fag));
    const ord = normal(valgt.sok).split(" ").filter(Boolean);
    let vist = 0;
    for (const k of kort) {
      const ok = (!valgt.fag || !k.fag || k.fag === valgt.fag)
        && (!valgt.tema || k.tema.includes(valgt.tema))
        && ord.every((o) => k.tekst.includes(o));
      k.li.hidden = !ok;
      if (ok) vist++;
    }
    for (const x of info) {
      const synlige = [...x.b.querySelectorAll(".sim-kort-liste > li")].some((li) => !li.hidden);
      x.b.hidden = !synlige || (x.generell && !!valgt.tema);
      if (x.generell && valgt.tema) for (const li of x.b.querySelectorAll(".sim-kort-liste > li")) if (!li.hidden) { li.hidden = true; vist--; }
      // Merknader under kortene (forsøk og lenker) vises bare uten søk, siden de ikke er en del av søket
      for (const p of x.b.querySelectorAll(".tema-merknad")) p.hidden = ord.length > 0;
    }
    const filtrert = valgt.fag || valgt.tema || ord.length;
    antall.textContent = filtrert ? `Viser ${vist} av ${kort.length}` : "";
    tom.hidden = vist > 0;
    const ny = new URLSearchParams();
    if (valgt.fag) ny.set("fag", valgt.fag);
    if (valgt.tema) ny.set("tema", valgt.tema);
    if (valgt.sok) ny.set("sok", valgt.sok);
    const s = ny.toString();
    history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
  }

  ramme.addEventListener("click", (e) => {
    const k = e.target.closest("button");
    if (!k) return;
    if ("fag" in k.dataset) {
      valgt.fag = k.dataset.fag;
      if (window.Fag) window.Fag.sett(valgt.fag);
      const t = temaer.find((x) => x.id === valgt.tema);
      if (t && valgt.fag && t.fag && t.fag !== valgt.fag) valgt.tema = "";
    }
    if ("tema" in k.dataset) valgt.tema = valgt.tema === k.dataset.tema ? "" : k.dataset.tema;
    oppdater();
  });
  sok.addEventListener("input", () => { valgt.sok = sok.value.trim(); oppdater(); });
  tom.addEventListener("click", (e) => {
    if (!e.target.closest("button")) return;
    valgt = { fag: "", tema: "", sok: "" }; sok.value = "";
    if (window.Fag) window.Fag.sett("");
    oppdater();
  });
  // Faget ble endret i menyen øverst
  window.addEventListener("fagendring", () => {
    valgt.fag = globaltFag();
    const t = temaer.find((x) => x.id === valgt.tema);
    if (t && valgt.fag && t.fag && t.fag !== valgt.fag) valgt.tema = "";
    oppdater();
  });
  oppdater();
})();
