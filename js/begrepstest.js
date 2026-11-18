// Begrepstester: flervalgsspørsmål med tilbakemelding med en gang.
// Markup (virker også uten JavaScript, da står alternativene som en liste og svaret i <details>):
//   <ol class="bt-liste">
//     <li class="bt" data-riktig="2">                     (nummeret til riktig alternativ, fra 1)
//       <p>Spørsmålet</p>
//       <ol class="bt-valg"><li>Alternativ</li><li data-hvorfor="Hvorfor dette er feil">…</li></ol>
//       <details class="bt-forklaring"><summary>Svar og forklaring</summary><p>…</p></details>
//     </li>
//   </ol>
// Ingenting lagres. Poengsummen teller bare første svar på hvert spørsmål.
(function () {
  const liste = document.querySelector(".bt-liste");
  if (!liste) return;
  const sporsmal = [...liste.querySelectorAll(".bt")];
  const status = document.createElement("p");
  status.className = "bt-status";
  status.setAttribute("aria-live", "polite");
  const nullstill = document.createElement("button");
  nullstill.type = "button"; nullstill.className = "knapp lys"; nullstill.textContent = "Start på nytt";
  const bunn = document.createElement("div");
  bunn.className = "bt-bunn";
  bunn.append(status, nullstill);
  liste.after(bunn);
  const BOKSTAV = "ABCDEFG";

  function oppdater() {
    const svart = sporsmal.filter((s) => s.dataset.forste);
    const riktige = svart.filter((s) => s.dataset.forste === "riktig").length;
    status.textContent = svart.length === sporsmal.length
      ? `Ferdig! Du hadde ${riktige} av ${sporsmal.length} riktige på første forsøk.`
      : `Du har svart på ${svart.length} av ${sporsmal.length} spørsmål. ${riktige} riktige på første forsøk.`;
  }

  for (const s of sporsmal) {
    const riktig = Number(s.dataset.riktig);
    const valg = s.querySelector(".bt-valg");
    const forklaring = s.querySelector(".bt-forklaring");
    const tilbake = document.createElement("p");
    tilbake.className = "bt-tilbakemelding";
    tilbake.setAttribute("aria-live", "polite");
    tilbake.hidden = true;
    valg.after(tilbake);
    if (forklaring) forklaring.hidden = true;
    valg.classList.add("aktiv");
    [...valg.children].forEach((li, i) => {
      const knapp = document.createElement("button");
      knapp.type = "button";
      knapp.className = "bt-knapp";
      knapp.innerHTML = `<span class="bt-bokstav">${BOKSTAV[i]}</span><span>${li.innerHTML}</span>`;
      li.replaceChildren(knapp);
      knapp.addEventListener("click", () => {
        const ok = i + 1 === riktig;
        if (!s.dataset.forste) { s.dataset.forste = ok ? "riktig" : "feil"; oppdater(); }
        knapp.classList.add(ok ? "riktig" : "feil");
        knapp.setAttribute("aria-label", `${BOKSTAV[i]}: ${ok ? "riktig" : "feil"}`);
        tilbake.hidden = false;
        tilbake.className = "bt-tilbakemelding " + (ok ? "riktig" : "feil");
        tilbake.textContent = ok ? "Riktig!" : "Ikke riktig. " + (li.dataset.hvorfor ? li.dataset.hvorfor + " " : "") + "Prøv igjen, eller les forklaringen.";
        if (forklaring) { forklaring.hidden = false; if (ok) forklaring.open = true; }
        if (ok) valg.querySelectorAll(".bt-knapp").forEach((k) => (k.disabled = true));
      });
    });
  }
  nullstill.addEventListener("click", () => {
    for (const s of sporsmal) {
      delete s.dataset.forste;
      s.querySelectorAll(".bt-knapp").forEach((k) => { k.disabled = false; k.classList.remove("riktig", "feil"); k.removeAttribute("aria-label"); });
      const t = s.querySelector(".bt-tilbakemelding"); t.hidden = true;
      const f = s.querySelector(".bt-forklaring"); if (f) { f.hidden = true; f.open = false; }
    }
    oppdater();
    liste.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  oppdater();
})();
