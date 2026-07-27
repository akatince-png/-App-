import React from "react";
import { Shell } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import MehrTab from "./MehrTab";
import { useT } from "../../i18n/translate";

// Dünner Shell/Header-Wrapper um MehrTab.jsx — "Mehr" ist eine der
// Ordner-Kacheln auf der Startseite (siehe HomeView.jsx), kein Reiter
// innerhalb des Archiv-Hubs (PlanView.jsx).
export default function MehrView({ onHome, onOpenLexikon }) {
  const { t } = useT();
  return (
    <Shell>
      <ViewHeader title={t("mehrView.titel")} onHome={onHome} homeTitle={t("mehrView.zumDashboard")} />
      <MehrTab onOpenLexikon={onOpenLexikon} />
    </Shell>
  );
}
