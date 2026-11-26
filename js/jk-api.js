// Joulekalenderen: all kontakt med serveren går gjennom denne fila.
// Serveren er nå Supabase (funksjonene jk_* i databasen). Flyttes kalenderen til en annen server, er det bare denne fila som må skrives om.
// Adressen og nøkkelen under er laget for å ligge åpent på en nettside. Bruk aldri service_role-nøkkelen her.

const JK_API = (() => {
  const ADRESSE = "https://tvotoynyjtcfknsjhflj.supabase.co";   // Project URL, for eksempel https://abcdefgh.supabase.co
  const NOKKEL = "sb_publishable_wINoGi7IX7TWfMajy2xarg_dA4xFiGC";    // anon key eller publishable key

  async function rpc(navn, data) {
    const hoder = { "Content-Type": "application/json", apikey: NOKKEL };
    if (!NOKKEL.startsWith("sb_")) hoder.Authorization = "Bearer " + NOKKEL;   // eldre anon-nøkler er JWT
    let svar;
    try {
      svar = await fetch(`${ADRESSE}/rest/v1/rpc/${navn}`, { method: "POST", headers: hoder, body: JSON.stringify(data) });
    } catch (e) {
      throw new Error("Får ikke kontakt med serveren. Sjekk nettforbindelsen og prøv igjen.");
    }
    const d = await svar.json().catch(() => null);
    if (!svar.ok) throw new Error((d && d.message) || `Noe gikk galt (feil ${svar.status}).`);
    return d;
  }

  return {
    klar: Boolean(ADRESSE && NOKKEL),
    meldPa: (d) => rpc("jk_meld_pa", { p_fag: d.fag, p_lagnavn: d.lagnavn, p_skole: d.skole, p_laerer: d.laerer, p_epost: d.epost }),
    klasse: (kode) => rpc("jk_klasse", { p_kode: kode }),
    kalender: (fag, kode) => rpc("jk_kalender", { p_fag: fag, p_kode: kode || null }),
    sendSvar: (kode, svar) => rpc("jk_send_svar", { p_kode: kode, p_svar: svar }),
    poengtavle: (fag) => rpc("jk_poengtavle", { p_fag: fag }),
  };
})();
