import React, { useRef, useState } from "react";
import { Card, PrimaryButton } from "./primitives";
import { danger, textMuted } from "./theme";
import Profilbild from "./Profilbild";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { profilbildEntfernen, profilbildHochladen } from "../data/profilbild";

// Profilbild im Profil (24.09., Nutzerinnen-Wunsch): freiwillig; die Karte
// sagt vor dem Hochladen klar, wer das Foto sieht. Auf Handy/Tablet öffnet
// die Dateiauswahl direkt Kamera oder Fotomediathek.
export default function ProfilbildKarte() {
  const { user } = useAuth();
  const { profilbildPfad, setProfilbildPfad } = useAppData();
  let vorname = null;
  try {
    vorname = localStorage.getItem("user_name");
  } catch {
    vorname = null;
  }
  const eingabe = useRef(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState(null);

  const gewaehlt = async (e) => {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei || !user) return;
    setFehler(null);
    setLaedt(true);
    const result = await profilbildHochladen(user.id, datei, profilbildPfad);
    setLaedt(false);
    if (!result.ok) return setFehler(result.error);
    setProfilbildPfad?.(result.pfad);
  };

  const entfernen = async () => {
    if (!user || !window.confirm("Profilbild wirklich entfernen?")) return;
    setFehler(null);
    const result = await profilbildEntfernen(user.id, profilbildPfad);
    if (!result.ok) return setFehler(result.error);
    setProfilbildPfad?.(null);
  };

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Profilbild</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Profilbild pfad={profilbildPfad} name={vorname} size={76} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.45 }}>
              Freiwillig. Dein Foto sehen nur <b>du</b>, <b>dein Coach</b> und <b>die Mitglieder deines Teams</b>, damit ihr wisst, wer wer ist.
            </div>
          </div>
        </div>
        <input ref={eingabe} type="file" accept="image/*" onChange={gewaehlt} style={{ display: "none" }} aria-label="Profilbild auswählen" />
        <div style={{ marginTop: 12 }}>
          <PrimaryButton onClick={() => eingabe.current?.click()} disabled={laedt}>
            {laedt ? "Wird hochgeladen …" : profilbildPfad ? "📷 Anderes Foto wählen" : "📷 Foto hinzufügen"}
          </PrimaryButton>
        </div>
        {profilbildPfad && !laedt && (
          <button
            type="button"
            onClick={entfernen}
            style={{ marginTop: 10, border: "none", background: "transparent", color: danger, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
          >
            Profilbild entfernen
          </button>
        )}
        {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 8 }}>{fehler}</div>}
      </Card>
    </>
  );
}
