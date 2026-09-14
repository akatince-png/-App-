import React, { createContext, useContext, useEffect, useRef } from "react";
import { pruefeAusgefalleneEintraege } from "../utils/ausgefallenSweep";
import { useShallowStableValue } from "./useShallowStableValue";
import { useAuth } from "./AuthContext";
import { useAdmin } from "./AdminContext";
import { CoreDataProvider, useCoreData } from "./appData/CoreDataContext";
import { TrackingDataProvider, useTrackingData } from "./appData/TrackingDataContext";
import { PlatformDataProvider, usePlatformData } from "./appData/PlatformDataContext";

// Globalen Datentopf aufteilen (App-Bauplan-Punkt): dieser einzelne
// Provider bündelte vorher ~33 Daten-Hooks direkt in einem einzigen
// ~150-Felder-Objekt — jede State-Änderung in IRGENDEINEM davon (ein
// Supplement abhaken, eine neue Team-Nachricht, ...) rendert dadurch
// JEDE Komponente neu, die überhaupt useAppData() aufruft, selbst wenn
// deren tatsächlich genutzte Felder unverändert blieben (useShallowStableValue
// dämpft das schon etwas, hilft aber nicht gegen einen einzelnen
// riesigen Kontext als Ganzes).
//
// Jetzt in drei fachlich getrennte, eigenständige Kontexte aufgeteilt —
// siehe context/appData/*.jsx:
//   - CoreDataContext: Profil/Protokoll-Grunddaten + Peptid-/Hormondosen
//     (Basis, von der die anderen beiden abhängen)
//   - TrackingDataContext: die täglich aktualisierten "Lebensbereiche"
//     (Supplemente, Mahlzeiten, Gewohnheiten, Training, Schlaf, ...)
//   - PlatformDataContext: Coaching/Social + App-Infrastruktur (Team,
//     Quests, Push, Spotify, Lexikon, ...)
//
// useAppData() bleibt als Kompatibilitäts-Fassade bestehen und liefert
// exakt dasselbe zusammengeführte Objekt wie vorher, in identischer
// Feld-Reihenfolge (wichtig für die wenigen Fälle, in denen zwei Hooks
// zufällig denselben Feldnamen tragen könnten — "letzter Spread gewinnt"
// bleibt an derselben Stelle wie zuvor) — alle ~60 bestehenden
// useAppData()-Aufrufstellen funktionieren dadurch unverändert weiter,
// ohne Anpassung. Neuer Code kann stattdessen gezielt useCoreData()/
// useTrackingData()/usePlatformData() verwenden, um nur auf Änderungen
// im jeweils tatsächlich gebrauchten Teil zu reagieren — die schrittweise
// Umstellung bestehender Stellen ist ein für sich abgrenzbarer, risikoarmer
// nächster Schritt und keine Voraussetzung dafür, dass dieser Umbau schon
// jetzt seinen Zweck erfüllt.
const AppDataContext = createContext(null);

function AppDataFacade({ children }) {
  const core = useCoreData();
  const tracking = useTrackingData();
  const platform = usePlatformData();

  const value = useShallowStableValue({
    ...core,
    ...tracking,
    ...platform,
    // Muss nach den Spreads gesetzt werden, da profileData/protocolData
    // (in core zusammengeführt) ihr eigenes `loading`-Feld mitbringen —
    // dieselbe Begründung/Reihenfolge wie zuvor im unaufgeteilten
    // AppDataContext.jsx.
    loading: core.loading,
  });

  // Einmal pro Kalendertag und pro echtem App-Start prüfen, was gestern
  // (bzw. seit dem letzten Öffnen) geplant, aber nie bestätigt wurde, und
  // automatisch als "ausgefallen" im Änderungsprotokoll vermerken — siehe
  // utils/ausgefallenSweep.js. sweepLaufendRef verhindert einen zweiten
  // Lauf durch StrictMode/Re-Renders innerhalb derselben Sitzung.
  const sweepLaufendRef = useRef(false);
  useEffect(() => {
    if (value.loading || !value.userId || sweepLaufendRef.current) return;
    sweepLaufendRef.current = true;
    pruefeAusgefalleneEintraege(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.loading, value.userId]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  // Im "Verwalten als"-Modus (Admin-Dashboard) lädt/speichert die App die
  // Daten der ausgewählten Probandin/des Probanden statt der eigenen —
  // jeder Hook nimmt userId ohnehin schon als Parameter, dadurch reicht
  // dieser eine Umschaltpunkt, um die komplette App stellvertretend zu
  // bedienen. Root() in App.jsx erzwingt beim Wechsel einen Remount
  // (key={proband?.id || "self"}), damit kein alter State übrig bleibt.
  const { proband } = useAdmin();
  const userId = proband?.id || user?.id;

  return (
    <CoreDataProvider userId={userId}>
      <TrackingDataProvider>
        <PlatformDataProvider>
          <AppDataFacade>{children}</AppDataFacade>
        </PlatformDataProvider>
      </TrackingDataProvider>
    </CoreDataProvider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData muss innerhalb von AppDataProvider verwendet werden.");
  return ctx;
}

// Für die E2E-Testsuite (e2e/harness/TestApp.jsx): erlaubt, die App dort
// mit einem gemockten Wert zu rendern (<AppDataContext.Provider
// value={...}>), ohne echtes Supabase/echte Auth — normaler App-Code
// nutzt weiterhin ausschließlich useAppData().
export { AppDataContext };
