// Täglicher Dauertest-Durchlauf mit dem festen Testkonto "Claude Dauertest"
// (Nutzerinnen-Wunsch 23.09.2026: ein Testkonto dauerhaft behalten, jeden
// Tag einmal alles durchklicken und so auch die Langzeitfolgen — Serien,
// Punkte, Level, Verlauf, Wochenprotokolle — über denselben Account prüfen).
//
// Läuft gegen die LIVE-App (akaapp.vercel.app, echte Supabase-Datenbank).
// Das Konto ist eine ganz normale Coachee (kein Admin). Anleitung und
// Ablauf der täglichen Prüfung: scripts/dauertest/README.md.
//
// Aufruf:
//   AKA_TEST_PW=... node scripts/dauertest/tageslauf.mjs
// Optional: AKA_URL, AKA_TEST_EMAIL, AKA_OUT, AKA_CHROMIUM, AKA_SPKI (SPKI-
// Pin eines TLS-Proxys, nur in der Cloud-Umgebung nötig), AKA_TAG
// (YYYY-MM-DD, sonst heute in Europe/Berlin).
import { chromium } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const URL_BASIS = (process.env.AKA_URL || "https://akaapp.vercel.app").replace(/\/$/, "");
const EMAIL = process.env.AKA_TEST_EMAIL || "claude.dauertest@example.com";
const PW = process.env.AKA_TEST_PW;
if (!PW) {
  console.error("AKA_TEST_PW fehlt.");
  process.exit(2);
}
const START = "2026-09-23"; // erster Tag des Dauertests
const heuteBerlin = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
const TAG = process.env.AKA_TAG || heuteBerlin;
const tagIndex = Math.round((new Date(`${TAG}T12:00:00Z`) - new Date(`${START}T12:00:00Z`)) / 86400000);
const OUT = process.env.AKA_OUT || path.join("dauertest-out", TAG);
fs.mkdirSync(OUT, { recursive: true });

// Realistisches, aber reproduzierbares Verhalten: Tag 5, 12, 19, … ist ein
// Pausentag (nichts abhaken — prüft, dass nichts "bestraft" wird und
// Pflanzen nur schlafen), an anderen Tagen wird ab und zu ein einzelner
// Punkt ausgelassen (wie im echten Leben).
// Team-Vergleich (24.09.): jede Testperson hat ihren eigenen Fleiß
// (AKA_FLEISS, Anteil erledigter fälliger Punkte, Standard ≈ 0.83) und
// ihren eigenen Pausentag (AKA_PAUSE_VERSATZ, 0–6), damit sich die Teams
// unterscheiden und nicht alle am selben Tag pausieren.
const FLEISS = Number(process.env.AKA_FLEISS || "0.83");
const PAUSE_VERSATZ = Number(process.env.AKA_PAUSE_VERSATZ || "0");
const PAUSENTAG = (tagIndex + PAUSE_VERSATZ) % 7 === 5;
// Wiederholung nach einem abgebrochenen Lauf: nichts abhaken/eintragen,
// nur anmelden und alle Ansichten prüfen (keine doppelten Testdaten).
const NUR_ANSICHTEN = process.env.AKA_NUR_ANSICHTEN === "1";
const auslassen = (name) => {
  let h = tagIndex * 31;
  for (const c of `${EMAIL}|${name}`) h = (h * 33 + c.charCodeAt(0)) % 1000003;
  return h % 100 >= Math.round(FLEISS * 100);
};
const FEEDBACK = ["👍 Gespürt", "🤏 Ein bisschen", "➖ Nichts gemerkt"];

const bericht = {
  tag: TAG,
  tagIndex,
  pausentag: PAUSENTAG,
  url: URL_BASIS,
  schritte: [],
  befunde: [],
  konsolenFehler: [],
  seitenFehler: [],
  fehlerAntworten: [],
  ansichten: {},
};
const schritt = (s) => {
  bericht.schritte.push(s);
  console.log("•", s);
};
const befund = (s) => {
  bericht.befunde.push(s);
  console.log("⚠", s);
};

// In der Claude-Cloud-Umgebung läuft HTTPS über einen TLS-Proxy, dessen CA
// Chromium nicht kennt. Ohne AKA_SPKI wird der SPKI-Pin automatisch aus den
// "Proxy CA"-Zertifikaten des CA-Bundles berechnet (lokal: kein Bundle →
// keine Sonderbehandlung).
function proxySpkiPins() {
  const bundle = process.env.AKA_CA_BUNDLE || "/root/.ccr/ca-bundle.crt";
  if (!fs.existsSync(bundle)) return [];
  const pems = fs.readFileSync(bundle, "utf8").match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
  return pems
    .map((pem) => new crypto.X509Certificate(pem))
    .filter((c) => /Proxy CA/i.test(c.subject))
    .map((c) => crypto.createHash("sha256").update(c.publicKey.export({ type: "spki", format: "der" })).digest("base64"));
}
const pins = process.env.AKA_SPKI ? [process.env.AKA_SPKI] : proxySpkiPins();
const args = pins.length ? [`--ignore-certificate-errors-spki-list=${pins.join(",")}`] : [];
const browser = await chromium.launch({ executablePath: process.env.AKA_CHROMIUM || "/opt/pw-browsers/chromium", args });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "de-DE",
  timezoneId: "Europe/Berlin",
});
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && bericht.konsolenFehler.push(m.text().slice(0, 300)));
page.on("pageerror", (e) => bericht.seitenFehler.push(e.message.slice(0, 300)));
page.on("response", (r) => r.status() >= 400 && bericht.fehlerAntworten.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 160)}`));

const warte = (ms) => page.waitForTimeout(ms);
const text = async () => (await page.locator("body").innerText()).trim();
const foto = async (name) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
const spielstand = async () =>
  (await page.getByRole("button", { name: /^Spielstand:/ }).first().getAttribute("aria-label").catch(() => null)) || null;

// Große Feiern (Belohnungsfenster) bleiben bewusst stehen, bis man sie
// wegtippt (Nutzerinnen-Wunsch 23.09.) — das Skript tippt sie weg, bevor es
// weiterklickt, sonst verdecken sie die nächsten Knöpfe.
async function feierWegtippen() {
  for (let i = 0; i < 3; i++) {
    const juhu = page.getByRole("button", { name: /Juhu, weiter/ }).first();
    if (!(await juhu.isVisible().catch(() => false))) return;
    await juhu.click().catch(() => {});
    await warte(600);
  }
}

async function geheZu(view) {
  await page.goto(`${URL_BASIS}/#/${view}`);
  await warte(2500);
  // Bereiche werden nachgeladen — über den Sandbox-Proxy manchmal langsam.
  // Bis zu 10 s warten, solange nur "Lädt..." zu sehen ist, statt die
  // Ansicht fälschlich als leer zu melden.
  for (let i = 0; i < 12 && /Lädt(…|\.\.\.)/.test(await text().catch(() => "")); i++) await warte(1000);
  await feierWegtippen();
}

try {
  // 1) Anmelden — inkl. Messung, ob die App nach dem Login hängen bleibt
  // (am 23.09. blieb sie nach dem ersten Login bei "Lädt..." stehen, bis
  // neu geladen wurde).
  // Startseite laden — bei einem kurzen Verbindungsfehler (502 über den
  // Sandbox-Proxy) bis zu 3× neu versuchen.
  for (let versuch = 0; versuch < 3; versuch++) {
    await page.goto(URL_BASIS).catch(() => {});
    if (await page.locator("input[type=email]").waitFor({ timeout: 15000 }).then(() => true).catch(() => false)) break;
  }
  await page.locator("input[type=email]").fill(EMAIL);
  await page.locator("input[type=password]").fill(PW);
  const t0 = Date.now();
  await page.getByRole("button", { name: "Anmelden" }).click();
  const geladen = await page
    .getByRole("button", { name: /^Spielstand:/ })
    .first()
    .waitFor({ timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  bericht.loginSekunden = Math.round((Date.now() - t0) / 100) / 10;
  if (!geladen) {
    befund(`Nach dem Login nach 20 s keine Startseite (Seite zeigt: "${(await text()).slice(0, 80)}") — lade neu.`);
    await foto("00-login-haengt");
    await page.reload();
    await page.getByRole("button", { name: /^Spielstand:/ }).first().waitFor({ timeout: 20000 });
  }
  schritt(`Angemeldet (${bericht.loginSekunden} s)`);
  // In-App-Messung (utils/startzeit.js) zum Vergleich mit der Skript-Messung.
  bericht.appTempo = await page.evaluate(() => JSON.parse(localStorage.getItem("aka_startzeiten") || "[]")[0] || null).catch(() => null);
  await warte(2000);
  bericht.spielstandVorher = await spielstand();
  await foto("01-home-vorher");

  if (!NUR_ANSICHTEN) {
  // 1b) Coach-Chat (seit 24.09.): Hinweis "Dein Coach hat geschrieben" oben
  //     auf der Startseite → Chat öffnen, mit einer Schnellantwort antworten
  //     (mit demselben Fleiß wie beim Abhaken).
  const coachHinweis = page.getByRole("button", { name: /Dein Coach hat geschrieben/ }).first();
  if (await coachHinweis.isVisible().catch(() => false)) {
    await coachHinweis.click();
    await warte(2500);
    const chat = page.getByRole("dialog", { name: /Chat: Dein Coach/ });
    await foto("01b-coach-chat");
    if (!auslassen("coach-antwort")) {
      await chat.getByRole("button", { name: "Danke!" }).click().catch(() => befund("Schnellantwort im Coach-Chat nicht gefunden"));
      await warte(1500);
      schritt("Coach-Chat: Nachricht gelesen und mit „Danke!“ geantwortet");
    } else schritt("Coach-Chat: Nachricht gelesen, bewusst (noch) nicht geantwortet");
    await chat.getByRole("button", { name: "Zurück" }).click().catch(() => {});
    await warte(1500);
    if (await page.getByRole("button", { name: /Dein Coach hat geschrieben/ }).isVisible().catch(() => false)) befund("Hinweis „Dein Coach hat geschrieben“ bleibt nach dem Lesen stehen");
  }

  // 1c) Karte "Passt deine Morgenroutine-Zeit noch?" (seit 25.09.): die
  //     Testpersonen laufen abends, ihre Morgenroutine (Start 07:00) ist
  //     also immer spät. Jede Person reagiert anders, damit alle Wege
  //     täglich echt benutzt werden: Claude "passt so", Mia stellt um,
  //     Jonas ignoriert (→ der Test-Coach spricht ihn an), Lea fragt den Coach.
  const zeitKarte = page.getByRole("region", { name: /Passt deine (Morgen|Abend)routine-Zeit noch/ }).first();
  if (await zeitKarte.isVisible().catch(() => false)) {
    await foto("01c-zeit-karte");
    const wahl = { "claude.dauertest@example.com": "passt", "claude.dauertest2@example.com": "umstellen", "claude.dauertest4@example.com": "coach" }[EMAIL] || "ignorieren";
    if (wahl === "passt") await zeitKarte.getByRole("button", { name: /Nein, passt so/ }).click();
    if (wahl === "umstellen") await zeitKarte.getByRole("button", { name: /umstellen$/ }).click();
    if (wahl === "coach") {
      await zeitKarte.getByRole("button", { name: /Mit meinem Coach besprechen/ }).click();
      await warte(2500);
      const chat = page.getByRole("dialog", { name: /Chat: Dein Coach/ });
      if (!/klappt meist erst gegen/.test(await chat.getByRole("textbox").inputValue().catch(() => ""))) befund("Zeit-Karte: Satz für den Coach nicht vorbereitet");
      await chat.getByRole("button", { name: "Senden" }).click().catch(() => befund("Zeit-Karte: Senden im Coach-Chat nicht möglich"));
      await warte(1500);
      await chat.getByRole("button", { name: "Zurück" }).click().catch(() => {});
    }
    await warte(1500);
    schritt(`Zeit-Karte gesehen, Reaktion: ${wahl}`);
  }

  // 2) Tagesplan abhaken (außer am Pausentag)
  await geheZu("tagesplan");
  for (const gruppe of ["🌅 Morgenroutine", "🌙 Abendroutine"]) {
    const g = page.getByText(gruppe, { exact: true }).first();
    if (await g.isVisible().catch(() => false)) {
      await g.click();
      await warte(500);
    }
  }
  await foto("02-tagesplan-vorher");
  const jetzt = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }).format(new Date());
  const erledigt = [];
  const ausgelassen = [];
  if (!PAUSENTAG) {
    const bearbeitet = new Set();
    for (let runde = 0; runde < 25; runde++) {
      const knoepfe = await page.getByRole("button", { name: "Bestätigen", exact: true }).all();
      let geklickt = false;
      for (const k of knoepfe) {
        const zeile = k.locator("xpath=ancestor::div[.//text()[contains(., ':')]][1]");
        const zeilenText = (await zeile.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
        const uhr = (zeilenText.match(/\b(\d{2}:\d{2})\b/) || [])[1] || "00:00";
        const name = zeilenText.replace(/\b\d{2}:\d{2}\b/g, "").replace(/JETZT|Bestätigen|✏️/g, "").trim().slice(0, 50);
        if (bearbeitet.has(name)) continue;
        bearbeitet.add(name);
        if (uhr > jetzt) continue; // noch nicht dran
        if (auslassen(name)) {
          ausgelassen.push(name);
          continue;
        }
        await k.click();
        await warte(1200);
        const chip = page.getByRole("button", { name: FEEDBACK[(tagIndex + erledigt.length) % 3] });
        if (await chip.isVisible().catch(() => false)) {
          await chip.click();
          await warte(800);
        }
        erledigt.push(name);
        geklickt = true;
        break; // DOM hat sich geändert — neu einsammeln
      }
      if (!geklickt) break;
    }
  }
  // Training (seit 24.09.): fällige Trainings über "Training starten" im
  // Live-Workout durchklicken (Knöpfe bis zum Ende/Speichern).
  if (!PAUSENTAG) {
    for (let t = 0; t < 2; t++) {
      const start = page.getByRole("button", { name: "Training starten" }).first();
      if (!(await start.isVisible().catch(() => false))) break;
      const zeile = start.locator("xpath=ancestor::div[.//text()[contains(., ':')]][1]");
      const zeilenText = (await zeile.innerText().catch(() => "")).replace(/\s+/g, " ");
      const uhr = (zeilenText.match(/\b(\d{2}:\d{2})\b/) || [])[1] || "00:00";
      if (uhr > jetzt || auslassen(`training${t}`)) {
        ausgelassen.push("Training");
        break;
      }
      await start.click();
      await warte(1500);
      const vorschauStart = page.getByRole("button", { name: /^(Training starten|Starten|Los geht's)$/ }).last();
      if (await vorschauStart.isVisible().catch(() => false)) {
        await vorschauStart.click();
        await warte(1500);
      }
      let klicks = 0;
      for (; klicks < 60; klicks++) {
        await feierWegtippen();
        // Knöpfe aus LiveWorkout.jsx/Timer.jsx: Satz fertig → Pause
        // überspringen → Stimmt, weiter / Stimmt, Training beenden; bei
        // Cardio (Stoppuhr) Start → Fertig.
        const k = page.getByRole("button", { name: /^(Satz fertig|Pause überspringen|Stimmt, weiter|Stimmt, Training beenden|Start|Fertig|Workout starten)$/ }).first();
        if (!(await k.isVisible().catch(() => false))) break;
        await k.click();
        await warte(700);
      }
      await foto(`03b-training-${t}`);
      erledigt.push(`Training (${klicks} Klicks)`);
      await geheZu("tagesplan");
    }
  }
  bericht.erledigt = erledigt;
  bericht.ausgelassen = ausgelassen;
  schritt(`Tagesplan: ${erledigt.length} erledigt, ${ausgelassen.length} bewusst ausgelassen${PAUSENTAG ? " (Pausentag)" : ""}`);
  await foto("03-tagesplan-nachher");

  // 3) Morgenroutine einmal komplett durchlaufen (außer Pausentag)
  if (!PAUSENTAG) {
    await geheZu("routinen");
    const start = page.getByText("▶️ Morgenroutine starten").first();
    if (await start.isVisible().catch(() => false)) {
      await start.click();
      await warte(1500);
      await foto("04-routine-start");
      let klicks = 0;
      for (; klicks < 20; klicks++) {
        const weiter = page.getByRole("button", { name: /^(Schritt fertig|Erledigt|Weiter|Fertig|Abschließen|Routine abschließen|Geschafft|Nächster Schritt|✓.*)$/ }).first();
        if (!(await weiter.isVisible().catch(() => false))) break;
        await weiter.click();
        await warte(900);
      }
      await feierWegtippen();
      await foto("05-routine-ende");
      schritt(`Morgenroutine: ${klicks} Klicks im Ablauf`);
      if (klicks === 0) befund("Morgenroutine-Ablauf: kein Weiter/Erledigt-Knopf gefunden — Skript oder UI prüfen (Foto 04).");
    }
  }

  // 4) Trinken: 2–4 Gläser (+200 ml) in der Hydration-Ansicht
  await geheZu("hydration");
  const schlucke = PAUSENTAG ? 0 : 2 + (tagIndex % 3);
  for (let i = 0; i < schlucke; i++) {
    await page.getByRole("button", { name: /\+200 ml/ }).first().click();
    await warte(1200);
    await feierWegtippen();
  }
  schritt(`Hydration: ${schlucke}× 200 ml eingetragen`);
  await foto("06-hydration");

  // 4b) Tageslicht (seit 24.09., nur wenn eingerichtet): Schnell-Knopf.
  if (!PAUSENTAG) {
    await geheZu("tageslicht");
    const plus = page.getByRole("button", { name: /^\+\s?(10|15|20|30) ?Min/ }).first();
    if (await plus.isVisible().catch(() => false)) {
      const n = 1 + (tagIndex % 3);
      for (let i = 0; i < n; i++) {
        await plus.click();
        await warte(900);
        await feierWegtippen();
      }
      schritt(`Tageslicht: ${n}× Schnell-Knopf`);
    }
  }

  // 5) Tagesrätsel (seit 24.09.): 5 Fragen, jeweils die erste Antwort —
  //    mal richtig, mal falsch. Am Pausentag nicht.
  if (!PAUSENTAG) {
    await geheZu("tagesraetsel");
    let fragen = 0;
    for (; fragen < 5; fragen++) {
      const antworten = page.getByRole("group", { name: "Antworten" }).getByRole("button");
      if (!(await antworten.first().isVisible().catch(() => false))) break;
      await antworten.nth((tagIndex + fragen) % 4).click();
      await warte(600);
      await page.getByRole("button", { name: /^(Weiter|Zur Auswertung)$/ }).click();
      await warte(700);
    }
    const juhu = page.getByRole("button", { name: /Juhu, weiter/ });
    if (await juhu.isVisible().catch(() => false)) await juhu.click();
    await foto("06b-tagesraetsel");
    schritt(`Tagesrätsel: ${fragen} Fragen beantwortet`);
  }

  // 6) Quests (Team-Quests vom Coach): annehmen, Fortschritt eintragen,
  //    ab Ziel abschließen.
  await geheZu("home");
  await warte(1500);
  let angenommen = 0;
  for (let i = 0; i < 5; i++) {
    const annehmen = page.getByRole("button", { name: "Quest annehmen" }).first();
    if (!(await annehmen.isVisible().catch(() => false))) break;
    await annehmen.click();
    await warte(1200);
    angenommen++;
  }
  const questWert = Math.min(3, 1 + (tagIndex % 3));
  const felder = await page.getByPlaceholder("Bisher erreicht").all();
  for (const feld of felder) {
    await feld.fill(String(questWert));
    await feld.locator("xpath=following::button[normalize-space()='Speichern'][1]").click().catch(() => {});
    await warte(900);
  }
  let abgeschlossen = 0;
  if (questWert >= 3) {
    for (let i = 0; i < 5; i++) {
      const knopf = page.getByRole("button", { name: "Quest abschließen" }).first();
      if (!(await knopf.isVisible().catch(() => false))) break;
      await knopf.click();
      await warte(600);
      const erreicht = page.getByPlaceholder(/^Erreicht/).first();
      if (await erreicht.isVisible().catch(() => false)) await erreicht.fill(String(questWert));
      await page.getByPlaceholder("Was hast du gemacht? (optional)").first().fill("Dauertest: automatisch abgeschlossen").catch(() => {});
      await page.getByRole("button", { name: "Abschließen", exact: true }).first().click();
      await warte(1500);
      abgeschlossen++;
    }
  }
  await foto("06c-quests");
  schritt(`Quests: ${angenommen} angenommen, Fortschritt ${questWert} bei ${felder.length} eingetragen, ${abgeschlossen} abgeschlossen`);

  // 7) Team (seit 24.09.): Team-Seite ansehen, wer seit 2+ Tagen ruhig ist,
  //    bekommt eine Motivationsnachricht; dann die Rangliste (Personen, Teams).
  await geheZu("team");
  await warte(1500);
  await foto("06d-team");
  const teamText = await text();
  if (!/Wochenziel als Team/.test(teamText)) befund("Team-Seite: kein Wochenziel sichtbar — Konto nicht im Team oder Laden fehlgeschlagen (Foto 06d).");
  bericht.teamText = teamText.slice(0, 800);
  // Gruppenprotokoll (seit 24.09.): eigene Gruppen-Gewohnheiten abhaken —
  // mit demselben Fleiß wie im Tagesplan, nicht am Pausentag.
  if (!PAUSENTAG) {
    let gruppe = 0;
    let ausgelassen = 0;
    for (let i = 0; i < 4; i++) {
      const knopf = page.getByRole("button", { name: / erledigt$/ }).filter({ hasText: "Erledigt?" }).first();
      if (!(await knopf.isVisible().catch(() => false))) break;
      const label = (await knopf.getAttribute("aria-label").catch(() => "")) || "";
      if (auslassen(`gruppe:${label}`)) {
        ausgelassen++;
        break;
      }
      await knopf.click();
      await warte(1500);
      await feierWegtippen();
      gruppe++;
    }
    if (gruppe || ausgelassen) schritt(`Gruppenprotokoll: ${gruppe} Gruppen-Gewohnheit(en) abgehakt, ${ausgelassen} bewusst ausgelassen`);
    await foto("06d2-gruppenprotokoll");
  }
  const motivieren = page.getByRole("button", { name: "💬 Motivieren" }).first();
  if (await motivieren.isVisible().catch(() => false)) {
    await motivieren.click();
    await warte(500);
    await page.getByRole("button", { name: "Du packst das! 💛" }).click();
    await page.getByRole("button", { name: "Senden (mit Push)" }).first().click();
    await warte(1500);
    schritt("Team: Motivationsnachricht an ein ruhiges Mitglied geschickt");
  }
  await page.getByRole("button", { name: "🏆 Rangliste" }).click().catch(() => {});
  await warte(1500);
  await foto("06e1-rangliste-personen");
  await page.getByRole("button", { name: "👥 Teams" }).click().catch(() => {});
  await warte(1500);
  await foto("06e-team-liga");
  } else {
    schritt("Nur Ansichten (Wiederholungslauf, keine Aktionen)");
  }
  await geheZu("home");
  await warte(1500);
  bericht.spielstandNachher = await spielstand();
  await foto("07-home-nachher");
  bericht.homeText = (await text()).slice(0, 1500);

  // 8) Alle Bereiche einmal öffnen (Absturz-/Leer-/Fehler-Check)
  const ansichten = [
    "tagesplan", "routinen", "atemuebungen", "tageslicht", "hydration", "schlaf", "bildschirmzeit", "ernaehrung", "training",
    "supplemente", "medikamente", "wochenuebersicht", "morgenroutine", "abendroutine", "verlauf", "archiv", "statistik",
    "erfolge", "tagebuch", "profil", "mehr", "lexikon", "team", "denksport",
  ];
  for (const v of ansichten) {
    const vorher = bericht.seitenFehler.length + bericht.konsolenFehler.length;
    await geheZu(v);
    const t = await text();
    const neueFehler = bericht.seitenFehler.length + bericht.konsolenFehler.length - vorher;
    bericht.ansichten[v] = { zeichen: t.length, fehler: neueFehler, anfang: t.slice(0, 120).replace(/\s+/g, " ") };
    if (t.length < 60 || /Etwas ist schiefgelaufen|Something went wrong/i.test(t)) befund(`Ansicht "${v}" wirkt leer oder abgestürzt.`);
    if (neueFehler) befund(`Ansicht "${v}": ${neueFehler} neue Konsolen-/Seitenfehler.`);
    await foto(`10-${v}`);
  }
  schritt(`${ansichten.length} Ansichten geöffnet`);
} catch (e) {
  befund(`Durchlauf abgebrochen: ${e.message.split("\n")[0]}`);
  await foto("99-abbruch").catch(() => {});
} finally {
  fs.writeFileSync(path.join(OUT, "bericht.json"), JSON.stringify(bericht, null, 2));
  await browser.close();
  console.log(`\nBericht: ${path.join(OUT, "bericht.json")}`);
  console.log(`Befunde: ${bericht.befunde.length}, Seitenfehler: ${bericht.seitenFehler.length}, Konsolenfehler: ${bericht.konsolenFehler.length}`);
}
