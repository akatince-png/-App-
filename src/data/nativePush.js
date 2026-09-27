import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

// Push in der iPhone-App (Capacitor, 27.09.): statt Web-Push meldet sich das
// Gerät bei Apple (APNs) an und bekommt einen Geräte-Schlüssel ("Token").
// Der landet in derselben Tabelle push_subscriptions wie die Web-Abos, mit
// endpoint "apns:<token>" – so bleibt ein Gerät = eine Zeile, und die
// Server-Funktionen erkennen am Präfix, dass sie über Apple senden müssen.
export const istNativ = () => Capacitor.isNativePlatform();
export const plattform = () => Capacitor.getPlatform();
export const APNS_PREFIX = "apns:";
const SPEICHER = "mp-apns-token";

export function gemerkterToken() {
  try {
    return localStorage.getItem(SPEICHER);
  } catch {
    return null;
  }
}
function tokenMerken(token) {
  try {
    if (token) localStorage.setItem(SPEICHER, token);
    else localStorage.removeItem(SPEICHER);
  } catch {
    /* ohne Speicher nur für diese Sitzung */
  }
}

export async function nativeBerechtigungDa() {
  const { receive } = await PushNotifications.checkPermissions();
  return receive === "granted";
}

// Fragt die Berechtigung an und holt den Token von Apple. Gibt den Token
// zurück oder wirft einen verständlichen Fehler.
export async function nativeAnmelden() {
  let { receive } = await PushNotifications.checkPermissions();
  if (receive === "prompt" || receive === "prompt-with-rationale") ({ receive } = await PushNotifications.requestPermissions());
  if (receive !== "granted") throw new Error("Berechtigung wurde nicht erteilt.");
  const token = await new Promise((resolve, reject) => {
    const handles = [];
    const aufraeumen = () => handles.forEach((h) => h.then((x) => x.remove()).catch(() => {}));
    const zeit = setTimeout(() => {
      aufraeumen();
      reject(new Error("Apple hat nicht rechtzeitig geantwortet. Bitte später noch einmal versuchen."));
    }, 15000);
    handles.push(
      PushNotifications.addListener("registration", (t) => {
        clearTimeout(zeit);
        aufraeumen();
        resolve(t.value);
      }),
    );
    handles.push(
      PushNotifications.addListener("registrationError", (e) => {
        clearTimeout(zeit);
        aufraeumen();
        reject(new Error(e?.error || "Anmeldung bei Apple fehlgeschlagen."));
      }),
    );
    PushNotifications.register().catch((e) => {
      clearTimeout(zeit);
      aufraeumen();
      reject(e);
    });
  });
  tokenMerken(token);
  return token;
}

export async function nativeAbmelden() {
  tokenMerken(null);
  try {
    await PushNotifications.unregister();
  } catch {
    /* schon abgemeldet */
  }
}
