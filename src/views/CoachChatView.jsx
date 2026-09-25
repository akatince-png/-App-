import React, { useState } from "react";
import ChatFenster from "../ui/ChatFenster";
import { useAppData } from "../context/AppDataContext";
import { useCoachChat } from "../data/coachChat";
import { COACH_CHAT_ENTWURF_KEY } from "../utils/routineVerspaetung";

// Chat mit dem Coach aus Sicht der Coachee (24.09., WhatsApp-Stil,
// Nutzerinnen-Freigabe der Vorschau). Erreichbar über den Hinweis oben auf
// der Startseite, die Karte "Chat mit deinem Coach" und die Push-
// Benachrichtigung (#/coach-chat).
const SCHNELLANTWORTEN = ["👍", "Danke!", "Mach ich", "Kannst du mich anrufen?"];

export default function CoachChatView({ onHome }) {
  const { userId } = useAppData();
  const { nachrichten, fehler, senden } = useCoachChat(userId, "coachee");
  // Vorbereiteter Satz, z. B. von der Karte "Passt deine Zeit noch?" (25.09.)
  // — steht im Eingabefeld, verschickt wird erst mit "Senden".
  const [entwurf] = useState(() => {
    try {
      const t = sessionStorage.getItem(COACH_CHAT_ENTWURF_KEY) || "";
      sessionStorage.removeItem(COACH_CHAT_ENTWURF_KEY);
      return t;
    } catch {
      return "";
    }
  });
  return (
    <ChatFenster
      titel="Dein Coach"
      untertitel="Nachrichten bleiben in der App"
      avatar={<div style={{ width: 40, height: 40, borderRadius: 99, background: "#E4E8F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧑‍🏫</div>}
      ich="coachee"
      startText={entwurf}
      nachrichten={nachrichten}
      fehler={fehler}
      onSenden={senden}
      onZurueck={onHome}
      vorlagen={SCHNELLANTWORTEN}
      platzhalter="Nachricht an deinen Coach …"
    />
  );
}
