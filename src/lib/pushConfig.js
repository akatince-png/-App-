// VAPID Public Key für Web Push — ist bewusst öffentlich (steht auch im
// Browser-Request), das Gegenstück (Private Key) liegt ausschließlich als
// Supabase Edge Function Secret und wird nie an den Client ausgeliefert.
export const VAPID_PUBLIC_KEY =
  "BAbKgAyHY3y8Os6Wnn__FqBzIDfbL_itgA-U3Ob3Q0izQqQL7EL_JhUre4t2hENJha0dCNshX6D62sfjl41Y3MQ";
