// Gemeinsamer Push-Versand (27.09.) für send-push, send-due-reminders und
// send-team-push: Web-Push (Browser/Home-Bildschirm) UND die iPhone-App über
// Apple (APNs). Welches Gerät was braucht, steht in push_subscriptions:
// endpoint "apns:<token>" = iPhone-App, sonst Web-Push.
//
// Für Apple braucht es diese Supabase-Secrets (setzt die Nutzerin selbst,
// Anleitung in docs/APP-STORE.md – NIE im Code oder Chat):
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (Inhalt der .p8-Datei),
//   optional APNS_BUNDLE_ID (Standard de.aka.app) und
//   APNS_UMGEBUNG ("production" Standard, "sandbox" für Xcode-Testläufe).
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) webpush.setVapidDetails("mailto:hello@myprotocols.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export type PushSub = { endpoint: string; p256dh?: string | null; auth_key?: string | null };
export type PushInhalt = { title: string; body: string; url?: string };

const APNS_PREFIX = "apns:";
const HOSTS = { production: "https://api.push.apple.com", sandbox: "https://api.sandbox.push.apple.com" };

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const textB64url = (s: string) => b64url(new TextEncoder().encode(s));

let schluessel: CryptoKey | null = null;
let jwtCache: { token: string; seit: number } | null = null;

async function apnsJwt(): Promise<string | null> {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const pem = Deno.env.get("APNS_PRIVATE_KEY");
  if (!keyId || !teamId || !pem) return null;
  // Apple erlaubt einen Token bis 60 Min., wir erneuern nach 50.
  if (jwtCache && Date.now() - jwtCache.seit < 50 * 60 * 1000) return jwtCache.token;
  if (!schluessel) {
    const inhalt = pem.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
    const der = Uint8Array.from(atob(inhalt), (c) => c.charCodeAt(0));
    schluessel = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  }
  const kopf = textB64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const daten = textB64url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const signatur = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, schluessel, new TextEncoder().encode(`${kopf}.${daten}`)),
  );
  const token = `${kopf}.${daten}.${b64url(signatur)}`;
  jwtCache = { token, seit: Date.now() };
  return token;
}

async function apnsSenden(host: string, jwt: string, geraet: string, inhalt: PushInhalt) {
  const res = await fetch(`${host}/3/device/${geraet}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": Deno.env.get("APNS_BUNDLE_ID") || "de.aka.app",
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({ aps: { alert: { title: inhalt.title, body: inhalt.body }, sound: "default" }, url: inhalt.url || "/" }),
  });
  let grund = "";
  if (!res.ok) {
    try {
      grund = (await res.json())?.reason || "";
    } catch {
      /* leerer Rumpf */
    }
  }
  return { status: res.status, grund };
}

// Ergebnis: "ok" | "ungueltig" (Zeile löschen) | "fehler" (später erneut).
export async function sendeAnGeraet(sub: PushSub, inhalt: PushInhalt): Promise<"ok" | "ungueltig" | "fehler"> {
  if (sub.endpoint.startsWith(APNS_PREFIX)) {
    const jwt = await apnsJwt().catch((e) => {
      console.error("APNs-Schlüssel unbrauchbar:", e?.message);
      return null;
    });
    if (!jwt) {
      console.warn("APNs nicht eingerichtet (Secrets fehlen) – iPhone-Push übersprungen.");
      return "fehler";
    }
    const geraet = sub.endpoint.slice(APNS_PREFIX.length);
    const zuerst = Deno.env.get("APNS_UMGEBUNG") === "sandbox" ? "sandbox" : "production";
    const danach = zuerst === "sandbox" ? "production" : "sandbox";
    // Xcode-Testläufe haben Sandbox-Tokens, TestFlight/App Store echte –
    // bei "falsche Umgebung" einmal die andere versuchen.
    let r = await apnsSenden(HOSTS[zuerst], jwt, geraet, inhalt);
    if (r.status === 400 && r.grund === "BadDeviceToken") r = await apnsSenden(HOSTS[danach], jwt, geraet, inhalt);
    if (r.status === 200) return "ok";
    console.error("APNs fehlgeschlagen:", r.status, r.grund);
    if (r.status === 410 || r.grund === "BadDeviceToken" || r.grund === "Unregistered") return "ungueltig";
    return "fehler";
  }
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh ?? "", auth: sub.auth_key ?? "" } },
      JSON.stringify({ title: inhalt.title, body: inhalt.body, url: inhalt.url || "/" }),
    );
    return "ok";
  } catch (err) {
    console.error("Push fehlgeschlagen für Endpoint:", sub.endpoint, err);
    // Abgelaufenes/ungültiges Abo (z. B. Browser-Daten gelöscht).
    const code = (err as { statusCode?: number })?.statusCode;
    return code === 404 || code === 410 ? "ungueltig" : "fehler";
  }
}
