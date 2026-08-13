import React, { useRef, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, TextArea, Label, Pill, CheckRow } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, textMain, textMuted } from "../../ui/theme";
import { exportElementAsPdf } from "../../utils/pdfExport";
import { FORMULARE } from "../../data/formulareVorlagen";

// Digitale, ausfüllbare Fassung der 10 Coaching-Formulare aus der AKA
// ADHS-Coaching-Praxisakademie (13.08., zweiter Nachtrag). Nur für die
// Admin/Coachin selbst — Pilotgespräche mit echten Menschen, komplett
// getrennt von den App-Daten der Coachees. Werte bleiben nur im
// Komponenten-State (kein Supabase-Schreibzugriff), Export läuft über
// dieselbe html2canvas+jsPDF-Pipeline wie die Wochenübersicht
// (`exportElementAsPdf`), gegen eine unsichtbare Klartext-Ansicht statt der
// interaktiven Formularfelder — native Inputs lassen sich mit html2canvas
// nicht zuverlässig fotografieren.

function zeilenAlsArray(feld) {
  return Array.isArray(feld.zeilen) ? feld.zeilen : Array.from({ length: feld.zeilen }, () => "");
}

function RasterFeld({ feld, werte, setFeldWert }) {
  const zeilenArr = zeilenAlsArray(feld);
  const zeilenSindFest = Array.isArray(feld.zeilen);
  return (
    <div style={{ overflowX: "auto", marginTop: 10, marginBottom: 6 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: feld.spalten.length * 130 }}>
        <thead>
          <tr>
            {feld.spalten.map((s, i) => (
              <th key={i} style={{ textAlign: "left", fontSize: 11, color: textMuted, padding: "6px 8px", borderBottom: `1px solid ${cardBorder}`, whiteSpace: "nowrap" }}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zeilenArr.map((zeileLabel, zi) => (
            <tr key={zi}>
              {feld.spalten.map((_, si) => {
                if (zeilenSindFest && si === 0) {
                  return (
                    <td key={si} style={{ padding: "6px 8px", fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${cardBorder}` }}>
                      {zeileLabel}
                    </td>
                  );
                }
                const cellKey = `${feld.key}::${zi}::${si}`;
                return (
                  <td key={si} style={{ padding: "4px 6px", borderBottom: `1px solid ${cardBorder}` }}>
                    <input
                      className="mp-input"
                      value={werte[cellKey] || ""}
                      onChange={(e) => setFeldWert(cellKey, e.target.value)}
                      style={{ width: "100%", minWidth: 90, boxSizing: "border-box", padding: "8px 8px", borderRadius: 8, border: `1px solid ${cardBorder}`, background: "#FAFBFA", fontSize: 13 }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeldRenderer({ feld, werte, setFeldWert }) {
  if (feld.typ === "static") {
    return <div style={{ fontSize: 12.5, color: textMuted, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 6, marginBottom: 10 }}>{feld.text}</div>;
  }
  if (feld.typ === "raster") {
    return <RasterFeld feld={feld} werte={werte} setFeldWert={setFeldWert} />;
  }
  if (feld.typ === "checkboxGroup") {
    return (
      <div style={{ marginTop: 6, marginBottom: 6 }}>
        {feld.label && <Label>{feld.label}</Label>}
        {feld.optionen.map((opt) => (
          <CheckRow
            key={opt}
            label={opt}
            checked={!!werte[`${feld.key}::${opt}`]}
            onToggle={() => setFeldWert(`${feld.key}::${opt}`, !werte[`${feld.key}::${opt}`])}
          />
        ))}
        {feld.mitAndere && (
          <TextInput
            value={werte[`${feld.key}::__andere`] || ""}
            onChange={(v) => setFeldWert(`${feld.key}::__andere`, v)}
            placeholder="Sonstiges, und zwar…"
          />
        )}
      </div>
    );
  }
  if (feld.typ === "checkbox") {
    return <CheckRow label={feld.label} checked={!!werte[feld.key]} onToggle={() => setFeldWert(feld.key, !werte[feld.key])} />;
  }
  if (feld.typ === "radio") {
    return (
      <>
        <Label>{feld.label}</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {feld.optionen.map((opt) => (
            <Pill key={opt} label={opt} selected={werte[feld.key] === opt} onClick={() => setFeldWert(feld.key, opt)} />
          ))}
        </div>
      </>
    );
  }
  if (feld.typ === "skala") {
    const opts = Array.from({ length: feld.max }, (_, i) => String(i + 1));
    return (
      <>
        <Label>{feld.label}</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {opts.map((opt) => (
            <Pill key={opt} label={opt} selected={String(werte[feld.key] ?? "") === opt} onClick={() => setFeldWert(feld.key, opt)} />
          ))}
        </div>
      </>
    );
  }
  if (feld.typ === "textarea") {
    return (
      <>
        <Label>{feld.label}</Label>
        <TextArea value={werte[feld.key] || ""} onChange={(v) => setFeldWert(feld.key, v)} />
      </>
    );
  }
  return (
    <>
      <Label>{feld.label}</Label>
      <TextInput value={werte[feld.key] || ""} onChange={(v) => setFeldWert(feld.key, v)} type={feld.typ === "date" ? "date" : "text"} />
    </>
  );
}

function ExportFeld({ feld, werte }) {
  if (feld.typ === "static") {
    return <div style={{ fontSize: 12, color: textMuted, whiteSpace: "pre-wrap", marginBottom: 10, lineHeight: 1.6 }}>{feld.text}</div>;
  }
  if (feld.typ === "raster") {
    const zeilenArr = zeilenAlsArray(feld);
    const zeilenSindFest = Array.isArray(feld.zeilen);
    return (
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 12 }}>
        <thead>
          <tr>
            {feld.spalten.map((s, i) => (
              <th key={i} style={{ textAlign: "left", fontSize: 10.5, color: textMuted, padding: "4px 6px", borderBottom: `1px solid ${cardBorder}` }}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zeilenArr.map((zeileLabel, zi) => (
            <tr key={zi}>
              {feld.spalten.map((_, si) => {
                if (zeilenSindFest && si === 0) {
                  return (
                    <td key={si} style={{ padding: "4px 6px", fontSize: 11.5, fontWeight: 600, borderBottom: `1px solid ${cardBorder}` }}>
                      {zeileLabel}
                    </td>
                  );
                }
                const cellKey = `${feld.key}::${zi}::${si}`;
                return (
                  <td key={si} style={{ padding: "4px 6px", fontSize: 11.5, borderBottom: `1px solid ${cardBorder}` }}>
                    {werte[cellKey] || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (feld.typ === "checkboxGroup") {
    return (
      <div style={{ marginBottom: 10 }}>
        {feld.label && <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>{feld.label}</div>}
        {feld.optionen.map((opt) => (
          <div key={opt} style={{ fontSize: 11.5, marginBottom: 2 }}>
            {werte[`${feld.key}::${opt}`] ? "☑" : "☐"} {opt}
          </div>
        ))}
        {feld.mitAndere && werte[`${feld.key}::__andere`] && <div style={{ fontSize: 11.5 }}>Sonstiges: {werte[`${feld.key}::__andere`]}</div>}
      </div>
    );
  }
  if (feld.typ === "checkbox") {
    return (
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        {werte[feld.key] ? "☑" : "☐"} {feld.label}
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: textMuted }}>{feld.label}</div>
      <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>{werte[feld.key] || "—"}</div>
    </div>
  );
}

function ExportAnsicht({ formular, werte }) {
  return (
    <div style={{ width: 780, padding: 30, background: "#fff", fontFamily: "'Inter', -apple-system, sans-serif", color: textMain }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>{formular.titel}</div>
      {formular.sections.map((section, si) => (
        <div key={si} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, borderBottom: `2px solid ${cardBorder}`, paddingBottom: 4 }}>{section.titel}</div>
          {section.felder.map((feld, fi) => (
            <ExportFeld key={fi} feld={feld} werte={werte} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminFormulareView({ onHome }) {
  const [aktivId, setAktivId] = useState(null);
  const [werteProFormular, setWerteProFormular] = useState({});
  const [exportLaeuft, setExportLaeuft] = useState(false);
  const exportRef = useRef(null);

  const aktiv = FORMULARE.find((f) => f.id === aktivId);
  const werte = werteProFormular[aktivId] || {};

  const setFeldWert = (key, value) => {
    setWerteProFormular((prev) => ({ ...prev, [aktivId]: { ...(prev[aktivId] || {}), [key]: value } }));
  };

  const exportieren = async () => {
    if (!exportRef.current) return;
    setExportLaeuft(true);
    try {
      await exportElementAsPdf(exportRef.current, `${aktiv.id}.pdf`);
    } finally {
      setExportLaeuft(false);
    }
  };

  if (!aktiv) {
    return (
      <Shell>
        <ViewHeader title="📋 Coaching-Vorlagen" onHome={onHome} />
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.6 }}>
          Die 10 Formulare aus deiner Praxisakademie, digital ausfüllbar und als PDF exportierbar. Nur für dich als
          Coachin — hat nichts mit den App-Daten deiner Coachees zu tun. Ausgefüllte Werte bleiben nur, solange du
          diese Ansicht offen hast; exportiere als PDF, um sie dauerhaft zu sichern.
        </div>
        {FORMULARE.map((f) => (
          <div key={f.id} style={{ marginBottom: 10 }}>
            <PrimaryButton variant="ghost" onClick={() => setAktivId(f.id)}>
              {f.kurzTitel}
            </PrimaryButton>
          </div>
        ))}
      </Shell>
    );
  }

  return (
    <Shell>
      <ViewHeader title={aktiv.kurzTitel} onHome={onHome} />
      <div style={{ marginBottom: 14 }}>
        <PrimaryButton variant="ghost" onClick={() => setAktivId(null)}>
          ‹ Alle Vorlagen
        </PrimaryButton>
      </div>

      {aktiv.sections.map((section, si) => (
        <Card key={si} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{section.titel}</div>
          {section.felder.map((feld, fi) => (
            <FeldRenderer key={fi} feld={feld} werte={werte} setFeldWert={setFeldWert} />
          ))}
        </Card>
      ))}

      <PrimaryButton onClick={exportieren} disabled={exportLaeuft}>
        {exportLaeuft ? "Erstellt PDF…" : "📄 Als PDF exportieren"}
      </PrimaryButton>

      {/* Unsichtbares Export-Raster, nur für html2canvas — siehe
          WochenuebersichtView.jsx für dasselbe Muster. Zeigt Klartext statt
          der interaktiven Formularfelder, weil html2canvas native
          Input-/Textarea-Werte nicht zuverlässig fotografiert. */}
      <div style={{ position: "absolute", left: -9999, top: 0, width: 840 }}>
        <div ref={exportRef}>
          <ExportAnsicht formular={aktiv} werte={werte} />
        </div>
      </div>
    </Shell>
  );
}
