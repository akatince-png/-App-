import React from "react";
import { textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { getKiAktiv } from "../utils/coachStorage";

// Kurzer Hinweistext über einem KiChat ("… der Assistent fragt nach") —
// nur dort sichtbar, wo KiChat selbst auch erscheint (gleiche Bedingung wie
// in KiChat.jsx). Bug-Fix Dauertest 23.09.: Coachees sahen den Hinweis auf
// einen Assistenten, den es für sie gar nicht gibt.
export default function KiHinweis({ children }) {
  const { isAdmin } = useAppData();
  const { proband } = useAdmin();
  if (!getKiAktiv() || !(proband !== null || isAdmin)) return null;
  return <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>{children}</div>;
}
