import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../ui/primitives";
import { accent, blue, danger, success, textMuted } from "../ui/theme";
import { useAuth } from "../context/AuthContext";

export default function LoginView() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "login") {
        const { error: err } = await signIn(email.trim(), password);
        if (err) throw err;
      } else {
        const { error: err, data } = await signUp(email.trim(), password);
        if (err) throw err;
        if (data.user && !data.session) {
          setInfo("Fast geschafft — bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben.");
        }
      }
    } catch (err) {
      setError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${accent}, ${blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 16,
            boxShadow: "0 8px 20px rgba(15, 184, 163, 0.25)",
          }}
        >
          🧬
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>Peptid Protokoll</div>
        <div style={{ fontSize: 13, color: textMuted, marginTop: 4, textAlign: "center" }}>
          Protokollieren. Verstehen. Optimieren.
        </div>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <Label>E-Mail</Label>
        <TextInput type="email" value={email} onChange={setEmail} placeholder="deine@email.de" />
        <Label>Passwort</Label>
        <TextInput type="password" value={password} onChange={setPassword} placeholder="Passwort" />

        {error && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{error}</div>}
        {info && <div style={{ fontSize: 12, color: success, marginTop: 10 }}>{info}</div>}

        <div style={{ marginTop: 20 }}>
          <PrimaryButton onClick={submit} disabled={loading || !email.trim() || !password}>
            {loading ? "Bitte warten..." : mode === "login" ? "Anmelden" : "Registrieren"}
          </PrimaryButton>
        </div>
      </Card>

      <button
        onClick={() => {
          setMode((m) => (m === "login" ? "register" : "login"));
          setError(null);
          setInfo(null);
        }}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 12,
          border: "none",
          background: "transparent",
          color: textMuted,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {mode === "login" ? "Noch kein Konto? Jetzt registrieren" : "Schon ein Konto? Anmelden"}
      </button>
    </Shell>
  );
}

function mapAuthError(message) {
  if (!message) return "Unerwarteter Fehler. Bitte erneut versuchen.";
  if (message.includes("Invalid login credentials")) return "E-Mail oder Passwort ist falsch.";
  if (message.includes("User already registered")) return "Für diese E-Mail existiert bereits ein Konto.";
  if (message.includes("Password should be at least")) return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  return message;
}
