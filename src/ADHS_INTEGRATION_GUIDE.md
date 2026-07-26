# ADHS-UI/UX Integration Guide

## 📋 Übersicht der neuen Komponenten

Diese Anleitung zeigt, wie du die ADHS-optimierten Komponenten in deine bestehende App integrierst **OHNE Breaking Changes**.

### 1. **ADHSModeToggle** (`/ui/ADHSModeToggle.jsx`)
Emergency-Button für Tage mit exekutiver Dysfunktion.

**Verwendung in HomeView:**
```jsx
import ADHSModeToggle from "../ui/ADHSModeToggle";

export default function HomeView({ onOpenView }) {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  return (
    <Shell>
      {/* Nach dem Greeting/Logo, vor den Progress-Rings */}
      <ADHSModeToggle 
        isEmergencyMode={isEmergencyMode}
        onToggle={setIsEmergencyMode}
      />
      
      {/* Bedingte Anzeige: Nur Essentielles im Notfallmodus */}
      {isEmergencyMode && (
        <div style={{ 
          padding: "12px", 
          background: "rgba(217, 119, 6, 0.1)", 
          borderRadius: "8px", 
          marginBottom: "12px",
          fontSize: "12px",
          color: "#D97706"
        }}>
          💡 Nur Basics heute: Medikamente + Wasser. Alles andere ist Bonus.
        </div>
      )}
      
      {/* Rest des Codes... */}
    </Shell>
  );
}
```

---

### 2. **QuickTaskList** (`/ui/QuickTaskList.jsx`)
One-Tap Check-ins mit Micro-Interactions und Sound-Feedback.

**Verwendung in HomeView (ersetzt bestehende Task-Liste):**
```jsx
import QuickTaskList from "../ui/QuickTaskList";

// Im bestehenden Code:
const angezeigteItems = gruppiereFuerAlsNaechstes(offeneItems, t, tLabel);

// Mapppe deine Items ins QuickTaskList-Format:
const quickTasksFormatted = angezeigteItems.map(item => ({
  key: item.key,
  name: item.name,
  detail: item.detail,
  done: item.done,
  kategorie: item.kategorie,
  onToggle: () => {
    // Hier deine bestehende Toggle-Logik aufrufen
    if (item.bundleIds) {
      confirmAlleTageszeit(tagStr, item.uhrzeit, item.bundleIds);
    } else {
      onOpenView("tagesplan");
    }
  }
}));

return (
  <Shell>
    {/* ... bestehendes Greeting/Logo/Progress ... */}
    
    {/* Ersetze die alte "Als Nächstes" Struktur mit: */}
    {angezeigteItems.length > 0 && (
      <>
        <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 10 }}>
          {t("home.alsNaechstes")}
        </div>
        <Card style={{ marginBottom: 20, padding: 8 }}>
          <QuickTaskList 
            items={quickTasksFormatted}
            maxItems={4}
            soundEnabled={true}
          />
        </Card>
      </>
    )}
    
    {/* ... Rest des Codes ... */}
  </Shell>
);
```

**Props:**
- `items`: Array von Task-Objekten
- `maxItems`: wie viele anzeigen (default: 4)
- `soundEnabled`: Audio-Feedback (default: true)

---

### 3. **GraceDayCard** (`/ui/GraceDayCard.jsx`)
Wochenrückblick mit Anti-Scham-Mechanismus.

**Verwendung in Weekly/Stats View (z.B. PlaeneView oder neue StatsView):**
```jsx
import GraceDayCard from "../ui/GraceDayCard";

export default function WeeklyStatsView() {
  const weeklyStats = {
    completedDays: 4,  // Wie viele Tage waren aktiv
    missedDays: 3,     // Wie viele Pausen
    totalDays: 7
  };

  return (
    <Shell>
      <h2>Diese Woche</h2>
      
      <GraceDayCard 
        weeklyStats={weeklyStats}
        motivationalMessage={null} // optional eigene Message
      />
      
      {/* ... Rest ... */}
    </Shell>
  );
}
```

**Props:**
- `weeklyStats`: `{ completedDays, missedDays, totalDays }`
- `motivationalMessage`: optional custom Message (sonst auto)

**Auto-Messages basierend auf Completion Rate:**
- ≥80%: "🚀 Fantastisch! Eine sehr starke Woche."
- ≥50%: "💪 Sehr gut! 50%+ bedeutet: du machst das richtig."
- ≥30%: "🌱 Du machst kleine Fortschritte. Das zählt."
- <30%: "💛 Kein Drama. Jeder Tag ist ein neuer Versuch."

---

## 🎨 CSS & Animationen

Alle Animationen wurden in `/src/index.css` hinzugefügt:

- `slideInSuccess`: Task-Slide-in bei Completion
- `successPulse`: Checkbox-Pulse (Dopamin!)
- `pulse`: Sparkles-Animation
- `softBounce`: CTA-Button Bounce
- `fadeInUp`: GraceDayCard Fade-In

**Respektiert automatisch `prefers-reduced-motion`** — keine Überflutung für Nutzer, die das eingestellt haben! ✨

---

## 🔧 Keine Breaking Changes!

Diese Integration:
- ✅ Ändert KEINE bestehenden Props oder Funktionen
- ✅ Erstellt nur neue optionale Komponenten
- ✅ Respektiert bestehende Datenstrukturen (kein Refactoring!)
- ✅ Ist vollständig **opt-in**: du kannst einzelne Komponenten weglassen
- ✅ Respektiert Accessibility-Einstellungen (reduced motion, etc.)

---

## 💡 ADHS-Design-Prinzipien (in den Komponenten implementiert)

| Prinzip | Umsetzung |
|---------|-----------|
| **One-Tap** | Große Tap-Ziele (min. 44x44px), keine Umwege |
| **Immediate Feedback** | Sound + Farb-Änderung + Animation beim Toggle |
| **No Shame** | 50%+ Erfolg, Pausen sind ok, Anti-Blame-Messaging |
| **Minimal Clutter** | Nur das Wesentliche pro Screen |
| **Visual Clarity** | Grün=Aktiv, Grau=Pause (kein Rot für Scheitern!) |
| **Dopamine Hits** | Sparkles, Pulse, Success-Farben für Belohnung |
| **Micro-Interactions** | Scale, Pulse, Fade — klein aber spürbar |

---

## 📱 Testing-Checklist

- [ ] ADHSModeToggle: Toggle funktioniert, UI wechselt korrekt
- [ ] QuickTaskList: One-Tap Toggle funktioniert, Sound bei Erfolg
- [ ] GraceDayCard: Stats berechnen korrekt, Messages passen
- [ ] Animations abspielen sich nur wenn `prefers-reduced-motion: no-preference`
- [ ] Mobile: Tap-Ziele sind mindestens 44x44px
- [ ] Farben: Grün für Erledigt, Grau für Pause, kein Rot

---

## 🚀 Next Steps

1. **Einfach reinkopieren**: Kopiere die Komponenten in `/ui/`
2. **CSS checken**: `index.css` wurde aktualisiert (keine Konflikte)
3. **In HomeView einbauen**: Folge den Examples oben
4. **Testen**: Tap, Toggle, Animations, Sound
5. **Optional**: Emergency Mode mit LocalStorage speichern (persistiert über Page-Reload)

---

**Happy ADHS-friendly Building! 💛**
