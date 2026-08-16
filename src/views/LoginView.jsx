import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../ui/primitives";
import { cardBorder, danger, textMuted } from "../ui/theme";
import Logo from "../ui/Logo";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/translate";
import { useLanguage, SUPPORTED_LANGS } from "../i18n/LanguageContext";

// Selbstregistrierung entfernt (Nutzerinnen-Vorgabe 16.08.: "er soll nur
// darüber reinkommen oder eingeladen werden müssen") — Konten entstehen
// jetzt ausschließlich über die Admin: entweder mit direkt gesetztem
// Passwort (AdminDashboardView.jsx "+ Neuen Zugang anlegen") oder per
// Einladungs-E-Mail ("✉️ Coachee einladen", öffnet InviteAcceptView beim
// Anklicken des Links). Damit das auch serverseitig gilt (nicht nur diese
// UI hier), sollte in den Supabase-Auth-Einstellungen zusätzlich "Enable
// email signups" deaktiviert werden — steht im Übergabeprotokoll.
export default function LoginView() {
  const { signIn } = useAuth();
  const { t } = useT();
  const { lang, setLang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await signIn(email.trim(), password);
      if (err) throw err;
    } catch (err) {
      setError(mapAuthError(err.message, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {SUPPORTED_LANGS.map((langCode) => (
            <button
              key={langCode}
              onClick={() => setLang(langCode)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${cardBorder}`,
                background: lang === langCode ? "#1E2B29" : "#fff",
                color: lang === langCode ? "#fff" : "#6B7280",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {langCode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, marginBottom: 32 }}>
        <Logo size={84} />
        <div style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginTop: 16 }}>AKA</div>
        <div style={{ fontSize: 14.5, color: textMuted, marginTop: 4, textAlign: "center" }}>Deine exekutive rechte Hand</div>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <Label>{t("login.email.label")}</Label>
        <TextInput type="email" value={email} onChange={setEmail} placeholder={t("login.email.placeholder")} />
        <Label>{t("login.password.label")}</Label>
        <TextInput type="password" value={password} onChange={setPassword} placeholder={t("login.password.label")} />

        {error && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{error}</div>}

        <div style={{ marginTop: 20 }}>
          <PrimaryButton onClick={submit} disabled={loading || !email.trim() || !password}>
            {loading ? t("login.button.loading") : t("login.tab.anmelden")}
          </PrimaryButton>
        </div>
      </Card>

      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", lineHeight: 1.5 }}>
        Neu hier? Du bekommst eine Einladung von deinem Coach — eine eigene Registrierung gibt es nicht.
      </div>
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
