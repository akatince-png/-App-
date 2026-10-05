#!/usr/bin/env node
// Passwörter der sechs Dauertest-Konten (05.10.2026, Nutzerin: „Ja, richte die
// Regel ein“ – Dauerfreigabe vom 29.09. für genau diese sechs Testkonten).
// Die Passwörter verlassen den Rechner nie und werden nie ausgegeben:
//   neu      erzeugt sechs Zufallspasswörter (Datei nur für diesen Rechner,
//            Rechte 600, außerhalb des Repos) und schreibt die SQL-Datei mit
//            den bcrypt-Hashes – nur die Hashes gehen an die Datenbank.
//   lauf <konto> -- <befehl…>
//            startet <befehl> mit AKA_TEST_PW für das Konto (nur im Kindprozess).
//   sperren  schreibt SQL mit Hashes von neuen, sofort verworfenen Zufalls-
//            passwörtern (danach kennt niemand die Passwörter) und löscht die
//            Passwort-Datei.
// Die Berechtigungsregel in .claude/settings.json erlaubt nur diesen Befehl.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import bcrypt from "bcryptjs";

const KONTEN = {
  claude: "claude.dauertest@example.com",
  mia: "claude.dauertest2@example.com",
  jonas: "claude.dauertest3@example.com",
  lea: "claude.dauertest4@example.com",
  test1: "test-yjmgc7d9@aka-test.local",
  admin: "claude.admintest@example.com",
};
const ORDNER = path.join(process.env.TMPDIR || "/tmp", "aka-dauertest");
const PW_DATEI = path.join(ORDNER, "pw.json");
const SQL_DATEI = path.join(ORDNER, "passwoerter.sql");

const zufall = () => crypto.randomBytes(24).toString("base64url");
const sql = (paare) =>
  paare.map(([mail, pw]) => `update auth.users set encrypted_password = '${bcrypt.hashSync(pw, 10)}' where email = '${mail}';`).join("\n") + "\n";

const [befehl, ...rest] = process.argv.slice(2);
fs.mkdirSync(ORDNER, { recursive: true, mode: 0o700 });

if (befehl === "neu") {
  const pw = Object.fromEntries(Object.keys(KONTEN).map((k) => [k, zufall()]));
  fs.writeFileSync(PW_DATEI, JSON.stringify(pw), { mode: 0o600 });
  fs.writeFileSync(SQL_DATEI, sql(Object.entries(KONTEN).map(([k, mail]) => [mail, pw[k]])));
  console.log(`6 neue Passwörter erzeugt (nicht angezeigt). SQL mit Hashes: ${SQL_DATEI}`);
} else if (befehl === "lauf") {
  const konto = rest[0];
  const trenner = rest.indexOf("--");
  if (!KONTEN[konto] || trenner < 0 || !rest[trenner + 1]) {
    console.error("Aufruf: lauf <claude|mia|jonas|lea|test1|admin> -- <befehl …>");
    process.exit(2);
  }
  if (!fs.existsSync(PW_DATEI)) {
    console.error("Keine Passwörter – erst „neu“ ausführen.");
    process.exit(2);
  }
  const pw = JSON.parse(fs.readFileSync(PW_DATEI, "utf8"));
  const [prog, ...args] = rest.slice(trenner + 1);
  const r = spawnSync(prog, args, { stdio: "inherit", env: { ...process.env, AKA_TEST_EMAIL: process.env.AKA_TEST_EMAIL || KONTEN[konto], AKA_TEST_PW: pw[konto] } });
  process.exit(r.status ?? 1);
} else if (befehl === "sperren") {
  fs.writeFileSync(SQL_DATEI, sql(Object.values(KONTEN).map((mail) => [mail, zufall()])));
  fs.rmSync(PW_DATEI, { force: true });
  console.log(`Passwort-Datei gelöscht. SQL zum Sperren (unbekannte Passwörter): ${SQL_DATEI}`);
} else {
  console.error("Aufruf: passwoerter.mjs neu | lauf <konto> -- <befehl …> | sperren");
  process.exit(2);
}
