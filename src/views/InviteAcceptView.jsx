import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../ui/primitives";
import { danger, textMuted } from "../ui/theme";
import Logo from "../ui/Logo";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

// Landing-Screen für Einladungs-/Passwort-Vergessen-Links (Nutzerinnen-
// Vorgabe 16.08.: "dass ich jemandem einen Link schicke ... er nur
// darüber reinkommt"). Wird in App.jsx angezeigt, solange
// AuthContext.invitePending true ist — der Supabase-Client hat aus dem
// URL-Hash bereits eine (vorläufige) Session hergestellt, hier wird nur
// noch ein echtes Passwort dafür gesetzt.
export default function InviteAcceptView() {
  const { clearInvitePending, signOut } = useAuth();
  const [passwort, setPasswort] = useState("");
  const [passwort2, setPasswort2] = useState("");
  const [speichern, setSpeichern] = useState(false);
  const [fehler, setFehler] = useState(null);

  const absenden = async () => {
    setFehler(null);
    if (passwort.length < 6) {
      setFehler("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (passwort !== passwort2) {
      setFehler("Die Passwörter stimmen nicht überein.");
      return;
    }
    setSpeichern(true);
    const { error } = await supabase.auth.updateUser({ password: passwort });
    setSpeichern(false);
    if (error) {
      setFehler(error.message);
      return;
    }
    clearInvitePending();
  };

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, marginBottom: 32 }}>
        <Logo size={84} />
        <div style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginTop: 16 }}>Willkommen bei AKA</div>
        <div style={{ fontSize: 14, color: textMuted, marginTop: 6, textAlign: "center" }}>
          Leg dir ein eigenes Passwort fest, um loszulegen.
        </div>
      </div>

      <Card>
        <Label>Neues Passwort</Label>
        <TextInput type="password" value={passwort} onChange={setPasswort} placeholder="Mindestens 6 Zeichen" />
        <Label>Passwort wiederholen</Label>
        <TextInput type="password" value={passwort2} onChange={setPasswort2} placeholder="Nochmal eingeben" />

        {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{fehler}</div>}

        <div style={{ marginTop: 20 }}>
          <PrimaryButton onClick={absenden} disabled={speichern || !passwort || !passwort2}>
            {speichern ? "Speichert …" : "Passwort festlegen & loslegen"}
          </PrimaryButton>
        </div>
      </Card>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            clearInvitePending();
            signOut();
          }}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
        >
          Abbrechen und abmelden
        </button>
      </div>
    </Shell>
  );
}
