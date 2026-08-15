// VAPID Public Key für Web Push — ist bewusst öffentlich (steht auch im
// Browser-Request), das Gegenstück (Private Key) liegt ausschließlich als
// Supabase Edge Function Secret und wird nie an den Client ausgeliefert.
//
// Neu erzeugt (15.08., spätabends) — das alte Schlüsselpaar existierte nur
// hier im Frontend, der private Gegenpart wurde nie als Supabase-Secret
// hinterlegt (send-push/send-due-reminders sind deshalb bislang bei jedem
// Aufruf schon beim Start abgestürzt: "No key set vapidDetails.publicKey").
// Beide Teile des NEUEN Paars gehören zusammen und müssen zusammen bleiben:
// dieser Public Key hier UND VAPID_PRIVATE_KEY als Supabase-Secret.
export const VAPID_PUBLIC_KEY =
  "BJWKW1cd5Dnn9jk7J5yimumNN3hv1YfBwLPcJXH3krPB24h6blfw0YaeNcqO2MQdwTQeFkTRJ8nHpCfgqtZ1fQA";
