import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { VAPID_PUBLIC_KEY } from "../lib/pushConfig";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Echte Erinnerungen (Web Push) — funktioniert ohne native App/Xcode, aber
// nur wenn die Seite vorher "Zum Home-Bildschirm hinzugefügt" wurde (iOS
// 16.4+) bzw. im Browser installiert ist (Android/Desktop) und der Nutzer
// die Berechtigung erteilt hat.
export function usePushNotifications(userId) {
  const [unterstuetzt] = useState(() => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
  const [aktiv, setAktiv] = useState(false);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    if (!unterstuetzt || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setAktiv(!!sub);
      } catch {
        // Kein Service Worker aktiv (z. B. noch nicht als App installiert) — bleibt inaktiv.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unterstuetzt, userId]);

  const pushAktivieren = useCallback(async () => {
    if (!unterstuetzt) return { ok: false, error: "Push-Benachrichtigungen werden auf diesem Gerät/Browser nicht unterstützt." };
    setLadend(true);
    setFehler(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setLadend(false);
        setFehler("Berechtigung wurde nicht erteilt.");
        return { ok: false, error: "Berechtigung wurde nicht erteilt." };
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      const json = sub.toJSON();
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({ user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth_key: json.keys.auth }, { onConflict: "endpoint" });
      if (error) throw error;
      setAktiv(true);
      setLadend(false);
      return { ok: true };
    } catch (err) {
      console.error(err);
      setLadend(false);
      setFehler(err.message);
      return { ok: false, error: `Aktivieren fehlgeschlagen: ${err.message}` };
    }
  }, [unterstuetzt, userId]);

  const pushDeaktivieren = useCallback(async () => {
    if (!unterstuetzt) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setAktiv(false);
  }, [unterstuetzt]);

  const pushTestSenden = useCallback(async () => {
    setFehler(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: { title: "MyProtocols", body: "So sieht eine Erinnerung aus. 🎉", url: "/" },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || data?.error) {
      const msg = data?.error || error.message;
      setFehler(msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  }, []);

  return { pushUnterstuetzt: unterstuetzt, pushAktiv: aktiv, pushLadend: ladend, pushFehler: fehler, pushAktivieren, pushDeaktivieren, pushTestSenden };
}
