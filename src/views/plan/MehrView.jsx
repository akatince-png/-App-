import React, { useState } from "react";
import { Shell } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import MehrTab from "./MehrTab";
import Icon from "../../ui/Icon";
import TagebuchModal from "../../ui/TagebuchModal";
import MehrHeuteKarten from "../../ui/MehrHeuteKarten";
import { accentDark, cardBorder, shadow, textMuted } from "../../ui/theme";
import { useT } from "../../i18n/translate";

// Dünner Shell/Header-Wrapper um MehrTab.jsx. Seit Design 2.0 (29.09.,
// Nutzerin: „Leiste reicht, Kacheln unten weg“) stehen hier oben die
// früheren Startseiten-Kacheln als Schnellzugriff: Alle Pläne, Archiv,
// Tagebuch (frei schreiben) und – im Admin-Modus – Neues Protokoll.
export default function MehrView({ onHome, onOpenLexikon, onOpenAdmin, onOpenErfolge, onOpenView, onNeuesProtokoll, istAdminModus }) {
  const { t } = useT();
  const [tagebuchOffen, setTagebuchOffen] = useState(false);
  const kachel = { textAlign: "left", borderRadius: 18, padding: "14px 10px", cursor: "pointer", background: "var(--mp-karte)", boxShadow: shadow, border: `1px solid ${cardBorder}`, fontFamily: "inherit", color: "inherit" };
  const eintraege = [
    { id: "schlaf", icon: "folder", titel: t("home.ordner.plaene.label"), sub: t("home.ordner.plaene.desc"), onClick: () => onOpenView?.("schlaf") },
    { id: "kalender", icon: "calendarWeek", titel: "Kalender", sub: "Mein Alltag", onClick: () => onOpenView?.("kalender") },
    { id: "archiv", icon: "archive", titel: t("home.ordner.archiv.label"), sub: t("home.ordner.archiv.desc"), onClick: () => onOpenView?.("archiv") },
    { id: "tagebuch", icon: "book", titel: "Tagebuch", sub: "Frei schreiben", onClick: () => setTagebuchOffen(true) },
  ];
  return (
    <Shell>
      <ViewHeader title={t("mehrView.titel")} onHome={onHome} homeTitle={t("mehrView.zumDashboard")} />
      {onOpenView && (
        <div className="mp-ordner-grid" data-mehr-schnellzugriff style={{ marginBottom: 20 }}>
          {eintraege.map((e) => (
            <button key={e.id} type="button" className="mp-tap" onClick={e.onClick} style={kachel}>
              <div style={{ marginBottom: 8 }}>
                <Icon name={e.icon} size={22} color={accentDark} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{e.titel}</div>
              <div style={{ fontSize: 10.5, color: textMuted }}>{e.sub}</div>
            </button>
          ))}
          {istAdminModus && onNeuesProtokoll && (
            <button type="button" className="mp-tap" onClick={onNeuesProtokoll} style={{ ...kachel, background: accentDark, border: "none", color: "#fff" }}>
              <div style={{ marginBottom: 8, fontSize: 22, fontWeight: 800, lineHeight: "22px" }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>Neues Protokoll</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>Von vorn beginnen</div>
            </button>
          )}
        </div>
      )}
      {onOpenView && <MehrHeuteKarten onOpenView={onOpenView} />}
      <MehrTab onOpenLexikon={onOpenLexikon} onOpenAdmin={onOpenAdmin} onOpenErfolge={onOpenErfolge} />
      {tagebuchOffen && <TagebuchModal onClose={() => setTagebuchOffen(false)} onOpenArchiv={() => onOpenView?.("tagebuch")} />}
    </Shell>
  );
}
