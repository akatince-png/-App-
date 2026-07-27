import React from "react";
import { Shell, Card } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { textMuted } from "../ui/theme";

export default function BlutzuckerView({ onHome, embedded = false }) {
  const content = (
    <>
      {!embedded && (
        <ViewHeader title="🩸 Blutzucker / CGM" onHome={onHome} />
      )}

      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>🚧</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Blutzucker / CGM — bald verfügbar</div>
        <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
          Hier entsteht die Anbindung an Blutzuckermessung / CGM-Sensoren, um Werte im
          Zeitverlauf zu erfassen und auszuwerten.
        </div>
      </Card>
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
