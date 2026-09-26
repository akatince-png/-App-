import React, { useEffect, useMemo, useState } from "react";
import { Shell, PrimaryButton, Pill } from "../../ui/primitives";
import { cardBorder, shadow, textMain, textMuted, accentDark, nachtVerlaufFest, logoVerlauf } from "../../ui/theme";
import { KATEGORIE_META, ROUTINE_META } from "../../utils/dayItems";
import { toLocalISODate } from "../../utils/dates";
import Icon from "../../ui/Icon";
import Logo from "../../ui/Logo";
import GehirnKarte from "../../ui/GehirnKarte";
import MenschFigur from "../../ui/MenschFigur";
import { EtappenBalken } from "../../ui/KernprogrammKarte";

// Vorstellung vor dem Start (26.09., Vorschau – Nutzerinnen-Vorgaben):
// AKA stellt sich im Look der App vor – echte Bausteine (Gehirn + Körper +
// Balken wie auf der Startseite, Routinen-Karten, Chat, Kernprogramm-Karte,
// Bereichsfarben) statt eigener Grafik-Welt. Inhalt = Philosophie aus
// UEBERGABEPROTOKOLL.md: exekutive rechte Hand, "Ein guter Morgen beginnt am
// Abend davor" (Abend immer zuerst), Bewegung, die Kleinigkeiten, Hilfe im
// schlechten Moment, sich kennenlernen + Coach, Community, Einstellungsphase.
// Alle Werte sind Beispiele. Jede Seite lässt sich überspringen.

const HEUTE = toLocalISODate(new Date());
const R = ROUTINE_META;
const K = KATEGORIE_META;

const BEISPIEL_BALKEN = [
  ["gewohnheit", 2, 3],
  ["morgenroutine", 5, 5],
  ["abendroutine", 4, 5],
  ["hormon", 1, 1],
  ["supplement", 2, 3],
  ["mahlzeit", 2, 3],
  ["training", 1, 1],
  ["hydration", 6, 8],
  ["tageslicht", 1, 2],
  ["bildschirmzeit", 1, 2],
].map(([kategorie, dailyCount, dailyTotal]) => ({ kategorie, name: (K[kategorie] || R[kategorie])?.label || kategorie, aktiv: true, dailyCount, dailyTotal }));
const BEISPIEL_KATEGORIEN = ["schlaf", "atemuebungen", "tagesraetsel", "training", "morgenroutine"].map((key) => ({ key, tageListe: [HEUTE], streak: 3 }));
const BEISPIEL_KOERPER = {
  kopf: 0.95,
  brust: 1,
  bauch: 0.75,
  bewegung: 1,
  licht: 0.8,
  chips: [
    ["😴", "7,5 h", "Schlaf"],
    ["💧", "1,6/2 l", "Wasser"],
    ["☀️", "25/30 min", "Tageslicht"],
    ["🏋️", "✓", "Training"],
    ["🍽️", "92 g Eiweiß", "Essen"],
  ],
};

const TABS = ["📅 Termin vergessen", "💊 Genommen?", "🥤 Nichts getrunken", "😴 Zu spät ins Bett", "⏰ Morgens Chaos", "🔥 Hyperfokus", "🏋️ Sport? Irgendwann …", "🍝 Essen vergessen", "📱 Nur kurz aufs Handy", "🔑 Wo ist mein Schlüssel?"];

const kartenStil = { background: "#fff", border: `1px solid ${cardBorder}`, borderRadius: 20, boxShadow: shadow };

function Titel({ children, unter }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.25, color: textMain }}>{children}</div>
      {unter && <div style={{ fontSize: 15, color: textMuted, lineHeight: 1.55, marginTop: 8 }}>{unter}</div>}
    </div>
  );
}

function IconPunkt({ meta, icon, size = 34 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size / 2.6, background: meta.dot, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 10px ${meta.dot}44` }}>
      <Icon name={icon || meta.icon} size={size * 0.55} color="#fff" strokeWidth={2.2} />
    </span>
  );
}

// ① Willkommen – Tabs zum Antippen
function SeiteWillkommen({ gewaehlt, setGewaehlt }) {
  const n = gewaehlt.length;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 18px" }}>
        <Logo size={64} withWordmark />
      </div>
      <Titel unter="Mit ADHS ist im Kopf oft alles gleichzeitig offen. Tipp an, was du kennst:">Viele Tabs im Kopf?</Titel>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <Pill key={t} label={t} selected={gewaehlt.includes(t)} onClick={() => setGewaehlt((g) => (g.includes(t) ? g.filter((x) => x !== t) : [...g, t]))} />
        ))}
      </div>
      <div aria-live="polite" style={{ marginTop: 10, borderRadius: 16, padding: "12px 14px", background: "#F5F6FA", fontSize: 14, lineHeight: 1.5, color: textMain, minHeight: 48 }}>
        {n === 0 ? (
          <span style={{ color: textMuted }}>Nichts davon? Auch gut – AKA macht den Alltag trotzdem leichter.</span>
        ) : (
          <>
            <b>{n} davon kennst du.</b>{" "}
            Genau dafür ist AKA da: App und Coach übernehmen das Planen, Erinnern und Im-Blick-Behalten.
          </>
        )}
      </div>
    </>
  );
}

// ② Was AKA übernimmt
const AUFGABEN = [
  { meta: R.abendroutine, icon: "calendarWeek", titel: "Planen", text: "Abend- und Morgenroutine, dein Tag" },
  { meta: K.hydration, icon: "droplet", titel: "Erinnern", text: "zur richtigen Zeit – Wasser, Einnahmen, Pausen" },
  { meta: K.gewohnheit, icon: "target", titel: "Tracken", text: "ein Tipp statt Tabelle" },
  { meta: K.schlaf, icon: "trophy", titel: "Auswerten", text: "macht dein Coach – nicht du" },
  { meta: K.hormon, icon: "capsule", titel: "Im Blick behalten", text: "Medikamente, Supplemente, Schlaf" },
];
const APPS = [
  ["calendarWeek", "#4E6690"],
  ["target", K.gewohnheit.dot],
  ["droplet", K.hydration.dot],
  ["dumbbell", K.training.dot],
  ["capsule", K.hormon.dot],
  ["moon", K.schlaf.dot],
  ["book", "#5B6B84"],
];
function SeiteUebernimmt() {
  return (
    <>
      <Titel unter="Was mit ADHS besonders schwerfällt, übernehmen die App und dein Coach.">Du lebst. AKA denkt mit.</Titel>
      <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          {AUFGABEN.map((a, i) => (
            <div key={a.titel} className="mp-vs-rein" style={{ ...kartenStil, borderRadius: 16, padding: "10px 12px", display: "flex", gap: 11, alignItems: "center", animationDelay: `${i * 0.12}s` }}>
              <IconPunkt meta={a.meta} icon={a.icon} size={32} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: a.meta.text }}>{a.titel}</div>
                <div style={{ fontSize: 12.5, color: textMuted }}>{a.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ width: 84, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <MenschFigur pose="sitzen" typ={3} size={84} label="Eine Person sitzt entspannt" />
        </div>
      </div>
      <div style={{ ...kartenStil, marginTop: 14, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          {APPS.map(([icon, farbe], i) => (
            <span key={icon} className="mp-vs-app" style={{ width: 28, height: 28, borderRadius: 9, background: farbe, display: "inline-flex", alignItems: "center", justifyContent: "center", animationDelay: `${i * 0.08}s`, "--x": `${(APPS.length - i) * 20}px` }}>
              <Icon name={icon} size={15} color="#fff" strokeWidth={2.2} />
            </span>
          ))}
          <span style={{ fontWeight: 900, color: accentDark, margin: "0 4px" }}>→</span>
          <span className="mp-vs-puls">
            <Logo size={38} />
          </span>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: textMuted, marginTop: 8 }}>Statt sieben Apps und zehn Plänen: eine.</div>
      </div>
    </>
  );
}

// ③ Abend vor Morgen
function RoutinenKarte({ meta, nummer, titel, zeit, schritte, bereit }) {
  return (
    <div style={{ ...kartenStil, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: meta.bg }}>
        <IconPunkt meta={meta} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: meta.text }}>
            {nummer} {titel}
          </div>
          <div style={{ fontSize: 12, color: meta.text, opacity: 0.8 }}>{zeit}</div>
        </div>
      </div>
      <div style={{ padding: "6px 14px 10px" }}>
        {schritte.map(([name, min, fertig], i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: i ? "1px solid #F1F1EE" : "none" }}>
            <span style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${meta.dot}`, background: fertig ? meta.dot : "#fff", color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{fertig ? "✓" : ""}</span>
            <span style={{ flex: 1, fontSize: 13.5, color: textMain }}>{name}</span>
            {bereit && bereit[i] ? <span style={{ fontSize: 11, fontWeight: 800, color: K.gewohnheit.text, background: K.gewohnheit.bg, borderRadius: 99, padding: "2px 8px" }}>liegt bereit</span> : <span style={{ fontSize: 12, color: textMuted }}>{min} Min.</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
function SeiteAbendMorgen() {
  return (
    <>
      <Titel unter="Darum fangen wir mit der Abendroutine an. Sie bereitet deinen Morgen vor – so bist du immer einen Schritt voraus.">Ein guter Morgen beginnt am Abend davor.</Titel>
      <RoutinenKarte
        meta={R.abendroutine}
        nummer="①"
        titel="Heute Abend"
        zeit="21:30 · Abendroutine"
        schritte={[
          ["Plan für morgen: Top 3", 3, true],
          ["Kleidung + Tasche bereitlegen", 4, true],
          ["Handy weg, Licht runter", 1, true],
          ["Ins Bett zur festen Zeit", 1, false],
        ]}
      />
      <div aria-hidden="true" style={{ position: "relative", height: 58, margin: "4px 0", borderRadius: 16, background: "linear-gradient(180deg, #E2E4F3, #FDEBD6)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 14, top: 8, fontSize: 12, fontWeight: 800, color: R.abendroutine.text }}>🌙 über Nacht</div>
        <div style={{ position: "absolute", right: 14, bottom: 8, fontSize: 12, fontWeight: 800, color: R.morgenroutine.text }}>vorbereitet ☀️</div>
        {["📝", "👕", "🎒", "🔑"].map((e, i) => (
          <span key={e} className="mp-vs-rueber" style={{ animationDelay: `${i * 0.9}s` }}>
            {e}
          </span>
        ))}
      </div>
      <RoutinenKarte
        meta={R.morgenroutine}
        nummer="②"
        titel="Morgen früh"
        zeit="6:30 · Morgenroutine"
        schritte={[
          ["Glas Wasser + Tageslicht", 3, false],
          ["10 Min. Bewegung", 10, false],
          ["Anziehen, Tasche nehmen", 2, false],
          ["Top 3 anschauen", 1, false],
        ]}
        bereit={[false, false, true, true]}
      />
      <div style={{ textAlign: "center", marginTop: 14, fontSize: 17, fontWeight: 800, color: accentDark }}>Immer einen Schritt voraus.</div>
    </>
  );
}

// ④ Bewegung
const SPORT = [
  ["laufen", 2, "Laufen"],
  ["kniebeuge", 1, "Kraft"],
  ["liegestuetz", 4, "Liegestütze"],
  ["kettlebell", 0, "Kettlebell"],
];
function SeiteBewegung() {
  const [wdh, setWdh] = useState(3);
  useEffect(() => {
    const id = setInterval(() => setWdh((w) => (w >= 10 ? 1 : w + 1)), 900);
    return () => clearInterval(id);
  }, []);
  const T = K.training;
  return (
    <>
      <Titel unter="Fester Teil des AKA-Konzepts. Du wählst nur, was dir Spaß macht, wann und wie viel.">Bewegung gehört jeden Tag dazu.</Titel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {SPORT.map(([pose, typ, name]) => (
          <div key={pose} style={{ borderRadius: 18, background: T.bg, padding: "10px 8px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <MenschFigur pose={pose} typ={typ} size={78} label={name} />
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginTop: 4 }}>{name}</div>
          </div>
        ))}
      </div>
      <div style={{ ...kartenStil, marginTop: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <IconPunkt meta={T} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>📷 Die Kamera zählt mit</div>
          <div style={{ fontSize: 12.5, color: textMuted }}>Kniebeugen · Satz 2 von 3</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: T.dot }}>
          {wdh}
          <span style={{ fontSize: 14, color: textMuted }}>/10</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {[
          ["sunrise", R.morgenroutine, "Morgens 10 Min. Aktivierung"],
          ["dumbbell", T, "2–3× pro Woche Sport, den du magst"],
          ["wind", K.atemuebung, "Schwerer Tag? 5 Minuten reichen."],
        ].map(([icon, meta, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: textMain }}>
            <IconPunkt meta={meta} icon={icon} size={26} />
            {text}
          </div>
        ))}
      </div>
    </>
  );
}

// ⑤ Kopf + Körper – die echte Gehirn-Karte der Startseite
function SeiteKopfKoerper() {
  const [zeitraum, setZeitraum] = useState("tag");
  return (
    <>
      <Titel unter="Im Hyperfokus gehen Trinken, Essen, Licht und Pausen schnell unter. Deine Startseite zeigt alles auf einen Blick – jeder Haken lädt dein Gehirn auf.">Die „Kleinigkeiten“, die untergehen.</Titel>
      <GehirnKarte widgets={BEISPIEL_BALKEN} kategorien={BEISPIEL_KATEGORIEN} zeitraum={zeitraum} setZeitraum={setZeitraum} tage={1} phase="tag" koerper={BEISPIEL_KOERPER} gruss="So sieht deine Startseite aus (Beispiel)" kopfUnten />
    </>
  );
}

// ⑥ Ein Tag mit AKA
const TAG = [
  ["21:30", "Am Vorabend: Plan für morgen steht", R.abendroutine, "moon"],
  ["6:30", "Wecker – die Morgenroutine läuft mit", R.morgenroutine, "sunrise"],
  ["6:45", "Check-in: grüner, gelber oder roter Tag?", K.gewohnheit, "target"],
  ["7:00", "10 Min. Bewegung + raus ins Licht", K.training, "dumbbell"],
  ["8:00", "Medikament ✓ · Supplemente ✓", K.hormon, "capsule"],
  ["10:00", "„Trink was.“", K.hydration, "droplet"],
  ["13:00", "Hyperfokus-Pause: 2 Min. atmen", K.atemuebung, "wind"],
  ["15:00", "2 Min. Kopftraining", K.gewohnheit, "trophy"],
  ["18:00", "Training – die Kamera zählt", K.training, "dumbbell"],
  ["21:30", "Abendroutine: Wie war dein Tag?", R.abendroutine, "moon"],
];
function SeiteTag() {
  const [schritt, setSchritt] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSchritt((s) => (s >= TAG.length ? 0 : s + 1)), 1100);
    return () => clearInterval(id);
  }, []);
  const prozent = Math.round((Math.min(schritt, TAG.length) / TAG.length) * 100);
  return (
    <>
      <Titel unter="Du lebst deinen Tag – AKA denkt mit und erinnert, wenn's drauf ankommt.">Ein Tag mit AKA.</Titel>
      <div style={{ borderRadius: 18, padding: "12px 14px", background: nachtVerlaufFest, color: "#fff", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 800 }}>
          <span>🧠 Dein Gehirn</span>
          <span>{prozent} %</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.12)", marginTop: 7, overflow: "hidden" }}>
          <div style={{ width: `${prozent}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width .6s ease-out" }} />
        </div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {TAG.map(([zeit, text, meta, icon], i) => {
          const erledigt = i < schritt;
          const jetzt = i === schritt;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 14, background: jetzt ? meta.bg : "#fff", border: `1px solid ${jetzt ? meta.dot : cardBorder}`, transition: "background .3s, border-color .3s", fontStyle: i === 0 ? "italic" : "normal" }}>
              <span style={{ width: 42, fontSize: 12, fontWeight: 800, color: textMuted }}>{zeit}</span>
              <IconPunkt meta={meta} icon={icon} size={24} />
              <span style={{ flex: 1, fontSize: 13, color: textMain }}>{text}</span>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: erledigt ? meta.dot : "transparent", border: `2px solid ${erledigt ? meta.dot : "#DADCE4"}`, color: "#fff", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{erledigt ? "✓" : ""}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ⑦ Grad nicht gut?
function SeiteAkut() {
  return (
    <>
      <Titel unter="Kein Aufholen, kein Schimpfen. Jetzt ist ein neuer Start.">Grad nicht gut? Ein Tipp genügt.</Titel>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div className="mp-vs-akut" style={{ width: 96, minHeight: 78, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "linear-gradient(135deg, #F59E0B, #FBBF24)", borderRadius: 16, boxShadow: "0 8px 16px rgba(245, 158, 11, 0.25)" }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#fff" }}>Grad nicht gut?</span>
        </div>
        <MenschFigur pose="sitzen" typ={1} size={78} label="Eine Person atmet ruhig" />
      </div>
      <div style={{ ...kartenStil, padding: 16, background: "#FFF7ED", border: "1px solid rgba(217, 119, 6, 0.25)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309", marginBottom: 10 }}>💡 Was hilft mir jetzt?</div>
        {[
          ["wind", K.atemuebung, "Atemübung", "2 Minuten mit Stimme – jetzt sofort"],
          ["book", R.abendroutine, "Moment festhalten", null],
          ["sun", K.tageslicht, "Tag kleiner machen", "1 Sache statt 3 – der Rest darf warten"],
        ].map(([icon, meta, titel, text]) => (
          <div key={titel} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fff", borderRadius: 14, padding: "9px 11px", marginBottom: 7 }}>
            <IconPunkt meta={meta} icon={icon} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>{titel}</div>
              {text ? (
                <div style={{ fontSize: 12.5, color: textMuted }}>{text}</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                  {["📍 wo", "🕒 wann", "👥 mit wem", "🍽️ was gegessen", "😤 wie stark"].map((c) => (
                    <span key={c} style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: R.abendroutine.bg, color: R.abendroutine.text }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ⑧ Dich kennenlernen + Coach (Chat im Stil von ChatFenster)
function Blase({ ich, text, zeit }) {
  return (
    <div style={{ alignSelf: ich ? "flex-end" : "flex-start", maxWidth: "80%", padding: "8px 11px 5px", borderRadius: 14, borderBottomRightRadius: ich ? 4 : 14, borderBottomLeftRadius: ich ? 14 : 4, background: ich ? "#DCE6FF" : "#fff", boxShadow: "0 1px 1px rgba(0,0,0,0.06)", fontSize: 14, lineHeight: 1.35, color: textMain }}>
      {text}
      <span style={{ display: "block", textAlign: "right", fontSize: 10.5, color: "#7A8199", marginTop: 2 }}>
        {zeit}
        {ich && <span style={{ marginLeft: 4, color: "#2D6FD6" }}>✓✓</span>}
      </span>
    </div>
  );
}
function SeiteKennenlernen() {
  const A = R.abendroutine;
  const tage = [
    ["Mo", 85, true],
    ["Di", 78, true],
    ["Mi", 35, false],
    ["Do", 90, true],
    ["Fr", 40, false],
    ["Sa", 80, true],
    ["So", 88, true],
  ];
  return (
    <>
      <Titel unter="Erst messen, dann planen. Dein Coach wertet aus, erkennt Muster und stellt mit dir nach.">Du lernst dich und dein ADHS kennen.</Titel>
      <div style={{ ...kartenStil, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: K.schlaf.text }}>🔍 MUSTER · BEISPIEL</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: textMain, marginTop: 3 }}>Wie ruhig war dein Morgen?</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 70, marginTop: 10 }}>
          {tage.map(([t, h, mit]) => (
            <div key={t} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ width: "100%", height: `${h}%`, borderRadius: "6px 6px 2px 2px", background: mit ? A.dot : "#DADCE4" }} />
              <span style={{ fontSize: 10.5, color: textMuted }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: textMuted, marginTop: 6 }}>
          <span>
            <b style={{ color: A.dot }}>■</b> mit Abendroutine
          </span>
          <span>
            <b style={{ color: "#C5C8D4" }}>■</b> ohne
          </span>
        </div>
      </div>
      <div style={{ marginTop: 12, borderRadius: 18, overflow: "hidden", border: `1px solid ${cardBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#fff", borderBottom: "1px solid #EEF0F5" }}>
          <span style={{ width: 30, height: 30, borderRadius: 15, background: K.gewohnheit.dot, color: "#fff", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>C</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Dein Coach</div>
            <div style={{ fontSize: 11.5, color: textMuted }}>schreibt dir in der App</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10, background: "#F3F1EC", backgroundImage: "radial-gradient(rgba(27,35,80,0.04) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
          <Blase text="An den Tagen mit Abendroutine lief dein Morgen deutlich ruhiger! 🙌 Sollen wir sie 15 Min. früher legen?" zeit="18:02" />
          <Blase ich text="Ja, gute Idee 👍" zeit="18:10" />
        </div>
      </div>
    </>
  );
}

// ⑨ Community
function SeiteCommunity() {
  const mitglieder = [
    ["L", K.hydration.dot, "Lena"],
    ["M", K.training.dot, "Mira"],
    ["J", K.gewohnheit.dot, "Jonas"],
    ["D", R.morgenroutine.dot, "Du"],
  ];
  return (
    <>
      <Titel unter="Viele Menschen mit ADHS an einem Ort: im Team Punkte sammeln, gemeinsam atmen, schauen, wie andere es machen.">Du bist nicht allein.</Titel>
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", marginBottom: 6 }}>
        <MenschFigur pose="jubel" typ={0} size={62} />
        <MenschFigur pose="handy" typ={4} size={62} />
        <MenschFigur pose="reden" typ={2} size={62} />
        <MenschFigur pose="jubel" typ={3} size={62} />
      </div>
      <div style={{ ...kartenStil, padding: "12px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: textMain }}>👥 Team Sonne</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 10px" }}>
          {mitglieder.map(([b, farbe, name]) => (
            <span key={name} style={{ border: `1px solid ${cardBorder}`, borderRadius: 999, padding: "3px 11px 3px 3px", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 24, height: 24, borderRadius: 12, background: farbe, color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{b}</span>
              {name}
            </span>
          ))}
        </div>
        {[
          ["☀️ Team Sonne", 71, 90, "#F4C542"],
          ["🌙 Team Mond", 46, 58, R.abendroutine.dot],
        ].map(([name, punkte, breite, farbe]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, marginTop: 5 }}>
            <span style={{ width: 94 }}>{name}</span>
            <span style={{ flex: 1, height: 10, borderRadius: 99, background: "#EEF0F5", overflow: "hidden" }}>
              <i className="mp-vs-fuell" style={{ display: "block", height: "100%", width: `${breite}%`, borderRadius: 99, background: farbe }} />
            </span>
            <span>{punkte}</span>
          </div>
        ))}
      </div>
      <div style={{ ...kartenStil, marginTop: 10, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, background: K.atemuebung.bg, border: "none" }}>
        <IconPunkt meta={K.atemuebung} size={30} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: K.atemuebung.text }}>Gemeinsame Atempause</div>
          <div style={{ fontSize: 12.5, color: K.atemuebung.text, opacity: 0.85 }}>Heute 13:00 · 6 sind dabei</div>
        </div>
      </div>
    </>
  );
}

// ⑩ Einstellungsphase + Start (Kernprogramm-Karte im App-Look)
function SeiteStart() {
  const schritte = [
    ["moon", R.abendroutine, "Abend + Morgen", "verankern, erst messen"],
    ["dumbbell", K.training, "Bewegung", "kommt dazu"],
    ["utensils", K.mahlzeit, "Essen + Planen", "Top 3, regelmäßig essen"],
    ["target", K.gewohnheit, "Feinschliff", "mit deinem Coach"],
  ];
  return (
    <>
      <Titel unter="In den ersten Wochen lernen wir uns kennen, messen und bauen Schritt für Schritt auf. Danach geht es weiter – so lange es dir hilft.">Erst stellen wir dich ein.</Titel>
      <div style={{ borderRadius: 18, padding: 14, background: "#1B2350", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.75, letterSpacing: 0.3 }}>DEIN AKA-COACHING</div>
        <div style={{ fontWeight: 900, fontSize: 17, marginTop: 4 }}>🧭 Die Einstellungsphase</div>
        <EtappenBalken stand={{ woche: 1 }} />
        <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
          {schritte.map(([icon, meta, titel, text]) => (
            <div key={titel} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconPunkt meta={meta} icon={icon} size={26} />
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>{titel}</span>
              <span style={{ fontSize: 12, opacity: 0.75 }}>{text}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 10, border: "2px dashed rgba(255,255,255,.5)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>∞</span>
            <span style={{ fontSize: 13.5, fontWeight: 800 }}>Danach</span>
            <span style={{ fontSize: 12 }}>dranbleiben, weiterentwickeln</span>
          </div>
        </div>
      </div>
      <div style={{ ...kartenStil, marginTop: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <MenschFigur pose="reden" typ={1} size={56} />
        <div style={{ fontSize: 13.5, color: textMain, lineHeight: 1.5 }}>
          <b>Deinen Start legst du mit deinem Coach fest.</b> Los geht&apos;s immer am Abend – mit deiner ersten Abendroutine.
        </div>
      </div>
    </>
  );
}

const SEITEN = [SeiteWillkommen, SeiteUebernimmt, SeiteAbendMorgen, SeiteBewegung, SeiteKopfKoerper, SeiteTag, SeiteAkut, SeiteKennenlernen, SeiteCommunity, SeiteStart];

export default function VorstellungView({ onDone, onCancel }) {
  const [index, setIndex] = useState(0);
  const [gewaehlt, setGewaehlt] = useState([]);
  const Seite = SEITEN[index];
  const letzte = index === SEITEN.length - 1;
  const fertig = () => onDone?.({ tabs: gewaehlt });
  const weiter = () => (letzte ? fertig() : setIndex((i) => i + 1));
  const stil = useMemo(
    () => `
.mp-vs-rein{animation:fadeInUp .45s ease-out both}
.mp-vs-app{animation:mpVsApp 5s ease-in-out infinite}
@keyframes mpVsApp{0%,30%{opacity:1;transform:none}60%,85%{opacity:.15;transform:translateX(var(--x)) scale(.4)}100%{opacity:1;transform:none}}
.mp-vs-puls{display:inline-flex;animation:mpVsPuls 5s ease-in-out infinite}
@keyframes mpVsPuls{0%,50%{transform:scale(1)}65%{transform:scale(1.2)}80%,100%{transform:scale(1)}}
.mp-vs-rueber{position:absolute;top:20px;left:0;font-size:20px;animation:mpVsRueber 3.6s ease-in-out infinite;opacity:0}
@keyframes mpVsRueber{0%{transform:translateX(30px);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(300px);opacity:0}}
.mp-vs-akut{animation:mpVsAkut 2.4s infinite}
@keyframes mpVsAkut{0%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}70%{box-shadow:0 0 0 14px rgba(245,158,11,0)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}}
.mp-vs-fuell{animation:mpVsFuell 1.2s ease-out both}
@keyframes mpVsFuell{from{width:0}}
@media (prefers-reduced-motion: reduce){.mp-vs-app,.mp-vs-puls,.mp-vs-rueber,.mp-vs-akut,.mp-vs-fuell,.mp-vs-rein{animation:none;opacity:1}}
`,
    [],
  );

  return (
    <Shell>
      <style>{stil}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 4 }} aria-label={`Seite ${index + 1} von ${SEITEN.length}`}>
          {SEITEN.map((_, i) => (
            <button key={i} type="button" aria-label={`Seite ${i + 1}`} onClick={() => setIndex(i)} style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 99, border: "none", padding: 0, cursor: "pointer", background: i === index ? accentDark : "#E1E3EA", transition: "width .3s" }} />
          ))}
        </div>
        <button type="button" onClick={fertig} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "6px 4px", fontFamily: "inherit" }}>
          Überspringen
        </button>
      </div>

      <div key={index} style={{ animation: "fadeInUp 0.4s ease-out", minHeight: 520 }}>
        <Seite gewaehlt={gewaehlt} setGewaehlt={setGewaehlt} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {index > 0 && (
          <button type="button" onClick={() => setIndex((i) => i - 1)} aria-label="Zurück" className="mp-tap" style={{ minWidth: 52, borderRadius: 16, border: `1px solid ${cardBorder}`, background: "#fff", color: textMuted, fontSize: 20, cursor: "pointer" }}>
            ‹
          </button>
        )}
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={weiter}>{letzte ? "Los geht's" : "Weiter"}</PrimaryButton>
        </div>
      </div>
      {onCancel && index === 0 && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button type="button" onClick={onCancel} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer", padding: "8px 12px", fontFamily: "inherit" }}>
            Abmelden
          </button>
        </div>
      )}
    </Shell>
  );
}
