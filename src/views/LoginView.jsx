import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../ui/primitives";
import { danger, success, textMuted } from "../ui/theme";
import Logo from "../ui/Logo";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/translate";

export default function LoginView() {
  const { signIn, signUp } = useAuth();
  const { t } = useT();
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
          setInfo(t("login.info.confirmEmail"));
        }
      }
    } catch (err) {
      setError(mapAuthError(err.message, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, marginBottom: 32 }}>
        <Logo size={64} />
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginTop: 16 }}>MyProtocols</div>
        <div style={{ fontSize: 13, color: textMuted, marginTop: 4, textAlign: "center" }}>Health. Organized.</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: 16,
          background: "#EDF1F0",
          marginBottom: 16,
        }}
      >
        {[
          { id: "login", label: t("login.tab.anmelden") },
          { id: "register", label: t("login.tab.registrieren") },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setError(null);
              setInfo(null);
            }}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: "none",
              background: mode === m.id ? "#fff" : "transparent",
              color: mode === m.id ? "#1E2B29" : textMuted,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: mode === m.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: 14 }}>
        <Label>{t("login.email.label")}</Label>
        <TextInput type="email" value={email} onChange={setEmail} placeholder={t("login.email.placeholder")} />
        <Label>{t("login.password.label")}</Label>
        <TextInput type="password" value={password} onChange={setPassword} placeholder={t("login.password.label")} />

        {error && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{error}</div>}
        {info && <div style={{ fontSize: 12, color: success, marginTop: 10 }}>{info}</div>}

        <div style={{ marginTop: 20 }}>
          <PrimaryButton onClick={submit} disabled={loading || !email.trim() || !password}>
            {loading ? t("login.button.loading") : mode === "login" ? t("login.tab.anmelden") : t("login.tab.registrieren")}
          </PrimaryButton>
        </div>
      </Card>
    </Shell>
  );
}

function mapAuthError(message, t) {
  if (!message) return t("login.error.unexpected");
  if (message.includes("Invalid login credentials")) return t("login.error.invalidCredentials");
  if (message.includes("User already registered")) return t("login.error.alreadyRegistered");
  if (message.includes("Password should be at least")) return t("login.error.passwordTooShort");
  return message;
}
