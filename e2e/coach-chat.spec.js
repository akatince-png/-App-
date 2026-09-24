import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Coach-Chat im WhatsApp-Stil + Coach-Übersicht "Wer braucht dich?" (24.09.).
// Supabase-Aufrufe werden per Netzwerk-Mock beantwortet; gesendete
// Nachrichten und Push-Aufrufe werden mitgeschrieben.
const jetzt = Date.now();
const iso = (minVorher) => new Date(jetzt - minVorher * 60000).toISOString();

async function chatMocks(page, verlauf) {
  const gesendet = { nachrichten: [], push: [] };
  await page.route("**/rest/v1/coachee_nachrichten*", async (r) => {
    if (r.request().method() === "POST") {
      const body = r.request().postDataJSON();
      const zeile = { id: `neu-${gesendet.nachrichten.length}`, gelesen: false, erstellt_am: new Date().toISOString(), ...(Array.isArray(body) ? body[0] : body) };
      gesendet.nachrichten.push(zeile);
      return r.fulfill({ json: zeile });
    }
    if (r.request().method() === "PATCH") return r.fulfill({ status: 204, body: "" });
    return r.fulfill({ json: verlauf });
  });
  await page.route("**/rest/v1/rpc/coach_nachrichten_gelesen*", (r) => r.fulfill({ status: 204, body: "" }));
  await page.route("**/functions/v1/send-team-push*", (r) => {
    gesendet.push.push(r.request().postDataJSON());
    return r.fulfill({ json: { ok: true, versendet: 0 } });
  });
  return gesendet;
}

test("Coachee: Hinweis oben auf der Startseite öffnet den Chat, Antwort per Schnellantwort", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const gesendet = await chatMocks(page, [
    { id: "a", text: "Hi, wie läuft deine Woche?", gelesen: false, erstellt_am: iso(30), absender: "coach" },
    { id: "b", text: "Ganz gut!", gelesen: true, erstellt_am: iso(10), absender: "coachee" },
  ]);
  await page.goto("/e2e/harness/index.html?isAdmin=0&coachnachricht=1#/home");
  await page.getByRole("button", { name: /Dein Coach hat geschrieben/ }).click();
  const chat = page.getByRole("dialog", { name: "Chat: Dein Coach" });
  await expect(chat).toBeVisible();
  await expect(chat.locator('[data-chat-nachricht="fremde"]')).toContainText("wie läuft deine Woche");
  await expect(chat.locator('[data-chat-nachricht="eigene"]')).toContainText("Ganz gut!");
  await expect(chat.getByLabel("gelesen")).toBeVisible();
  await chat.getByRole("button", { name: "Danke!" }).click();
  await expect(chat.locator('[data-chat-nachricht="eigene"]').last()).toContainText("Danke!");
  expect(gesendet.nachrichten[0]).toMatchObject({ text: "Danke!", absender: "coachee" });
  await expect.poll(() => gesendet.push.length).toBe(1);
  expect(gesendet.push[0]).toMatchObject({ art: "an-coach" });
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Coachee ohne neue Nachricht: Karte 'Chat mit deinem Coach' statt altem Formular", async ({ page }) => {
  await chatMocks(page, []);
  await page.goto("/e2e/harness/index.html?isAdmin=0#/home");
  await expect(page.getByRole("button", { name: /Dein Coach hat geschrieben/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Chat mit deinem Coach/ }).click();
  const chat = page.getByRole("dialog", { name: "Chat: Dein Coach" });
  await expect(chat.getByText("Noch keine Nachrichten", { exact: false })).toBeVisible();
  await chat.getByLabel("Nachricht an deinen Coach …").fill("Hallo!");
  await chat.getByRole("button", { name: "Senden" }).click();
  await expect(chat.locator('[data-chat-nachricht="eigene"]')).toContainText("Hallo!");
  await chat.getByRole("button", { name: "Zurück" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

const tag = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const PERSONEN = [
  { id: "p-mia", email: "mia@x.de", vorname: "Mia", onboarding_complete: true, is_admin: false, team_id: "t1", ungelesene_nachrichten: 0, letzte_aktivitaet: tag(0), punkte_7_tage: 41, aktive_tage_7: [tag(0), tag(1)], protokoll_startdatum: tag(3), protokoll_dauer_wochen: 12 },
  { id: "p-admin", email: "coach@x.de", vorname: "Coach", onboarding_complete: true, is_admin: true, team_id: null, ungelesene_nachrichten: 0, letzte_aktivitaet: null, punkte_7_tage: 0, aktive_tage_7: [] },
  { id: "p-jonas", email: "jonas@x.de", vorname: "Jonas", onboarding_complete: true, is_admin: false, team_id: "t2", ungelesene_nachrichten: 0, letzte_aktivitaet: tag(3), punkte_7_tage: 2, aktive_tage_7: [tag(3)] },
  { id: "p-lea", email: "lea@x.de", vorname: "Lea", onboarding_complete: true, is_admin: false, team_id: "t2", ungelesene_nachrichten: 1, letzte_aktivitaet: tag(0), punkte_7_tage: 30, aktive_tage_7: [tag(0)] },
];

test("Coach-Übersicht: wer dich braucht steht oben, Zeile öffnet Chat mit Vorlage und Push", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.route("**/rest/v1/rpc/admin_liste_probanden*", (r) => r.fulfill({ json: PERSONEN }));
  await page.route("**/rest/v1/teams*", (r) => r.fulfill({ json: [{ id: "t1", name: "Sonne" }, { id: "t2", name: "Mond" }] }));
  await page.route("**/rest/v1/training_*", (r) => r.fulfill({ json: [] }));
  const gesendet = await chatMocks(page, [{ id: "x", text: "Kannst du mich anrufen?", gelesen: false, erstellt_am: iso(60), absender: "coachee" }]);
  await page.goto("/e2e/harness/index.html#/admin-uebersicht");
  await expect(page.getByText("Heute für dich")).toBeVisible();
  // Reihenfolge: Lea (ungelesen), Jonas (seit 3 Tagen ruhig), Mia; Admin ausgeblendet.
  const zeilen = page.locator("button[aria-expanded]");
  await expect(zeilen).toHaveCount(3);
  await expect(zeilen.nth(0)).toContainText("Lea");
  await expect(zeilen.nth(1)).toContainText("seit 3 Tagen ruhig");
  await expect(zeilen.nth(2)).toContainText("Mia");
  await page.getByRole("button", { name: "Brauchen dich" }).click();
  await expect(zeilen).toHaveCount(2);
  await zeilen.nth(1).click();
  await page.getByRole("button", { name: /^💬 Chat( \(\d+ neu\))?$/ }).click();
  const chat = page.getByRole("dialog", { name: "Chat: Jonas" });
  await expect(chat.locator('[data-chat-nachricht="fremde"]')).toContainText("anrufen");
  await chat.getByRole("button", { name: "Wie läuft's bei dir?" }).click();
  await expect(chat.locator('[data-chat-nachricht="eigene"]')).toContainText("Wie läuft's bei dir?");
  expect(gesendet.nachrichten[0]).toMatchObject({ absender: "coach", user_id: "p-jonas" });
  await expect.poll(() => gesendet.push.length).toBe(1);
  expect(gesendet.push[0]).toMatchObject({ art: "coach", empfaengerId: "p-jonas" });
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Coach: Reiter 'Chats' listet Unterhaltungen nach zuletzt geschrieben, antippen öffnet den Verlauf", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.route("**/rest/v1/rpc/admin_liste_probanden*", (r) => r.fulfill({ json: PERSONEN }));
  await page.route("**/rest/v1/teams*", (r) => r.fulfill({ json: [] }));
  await page.route("**/rest/v1/training_*", (r) => r.fulfill({ json: [] }));
  const alle = [
    { id: "1", user_id: "p-mia", text: "Stark gemacht!", absender: "coach", gelesen: true, erstellt_am: iso(600) },
    { id: "2", user_id: "p-lea", text: "Kann ich später anfangen?", absender: "coachee", gelesen: false, erstellt_am: iso(5) },
  ];
  await page.route("**/rest/v1/coachee_nachrichten*", (r) => {
    if (r.request().method() !== "GET") return r.fulfill({ status: 204, body: "" });
    const url = r.request().url();
    return r.fulfill({ json: url.includes("user_id=eq.p-lea") ? [alle[1]] : url.includes("user_id=eq.") ? [] : alle });
  });
  await page.goto("/e2e/harness/index.html#/admin-uebersicht");
  await page.getByRole("button", { name: /💬 Chats/ }).click();
  const eintraege = page.getByRole("button", { name: /^Chat mit / });
  await expect(eintraege).toHaveCount(2);
  await expect(eintraege.nth(0)).toContainText("Kann ich später anfangen?");
  await expect(eintraege.nth(1)).toContainText("Du: Stark gemacht!");
  await eintraege.nth(0).click();
  await expect(page.getByRole("dialog", { name: "Chat: Lea" }).locator('[data-chat-nachricht="fremde"]')).toContainText("später anfangen");
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
