import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TagesEintragBearbeiten from "./TagesEintragBearbeiten";

const toggleSupplementErledigt = vi.fn(() => Promise.resolve());
const toggleHormonErledigt = vi.fn(() => Promise.resolve());
const toggleMahlzeitErledigt = vi.fn(() => Promise.resolve());
const toggleGewohnheitErledigt = vi.fn(() => Promise.resolve());
const ausnahmeSetzen = vi.fn(() => Promise.resolve({ ok: true, ausnahme: { id: "a1" } }));
const ausnahmeEntfernen = vi.fn(() => Promise.resolve({ ok: true }));
const aenderungVermerken = vi.fn();

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    toggleSupplementErledigt,
    toggleHormonErledigt,
    toggleMahlzeitErledigt,
    toggleGewohnheitErledigt,
    ausnahmeSetzen,
    ausnahmeEntfernen,
    aenderungVermerken,
  }),
}));
// primitives.jsx -> TextInput/TextArea importieren useDiktat.js -> utils/speech.js
// -> supabaseClient.js, das ohne VITE_SUPABASE_URL sofort wirft (gleiches
// Muster wie RoutineHeuteChecklist.test.jsx/RoutineSchritteListe.test.jsx).
vi.mock("../utils/speech", () => ({
  spracherkennungVerfuegbar: () => false,
  starteSprachErkennung: vi.fn(),
}));

function baueItem(overrides = {}) {
  return {
    kategorie: "supplement",
    key: "s-1",
    refId: "s1",
    hour: "08",
    uhrzeit: "08:00",
    name: "Vitamin D",
    detail: "1000 IE",
    done: false,
    raw: { id: "s1", name: "Vitamin D" },
    originalUhrzeit: "08:00",
    ausnahmeKategorie: "supplement",
    ausnahmeRefId: "s1",
    ausnahmeId: null,
    ...overrides,
  };
}

const DATUM = "2026-09-20";

beforeEach(() => {
  vi.clearAllMocks();
});

// Nutzerinnen-Nachfrage (17.09., nach dem Konsistenz-Check): "Kann ich die
// Tagesprotokolleingabe direkt ändern und dann auch für die Zukunft ändern?
// Werde ich gefragt: nur heute oder ganze Protokolllaufbahn?" — dieser
// Komponente hatte bisher KEINE Tests, obwohl sie genau das umsetzt. Deckt
// zusätzlich einen dabei gefundenen echten Bug ab (siehe
// ProtokollLogView.test.jsx): "geändert (nur dieser Tag)"/"entfällt (nur
// dieser Tag)" wurden zwar protokolliert, standen aber in KEINER
// Anzeige-Filterliste — hier wird nur das AUFRUFEN mit den richtigen
// Aktion-Strings verifiziert, die Sichtbarkeit selbst in ProtokollLogView.test.jsx.
describe("TagesEintragBearbeiten", () => {
  it("zeigt die Erledigt-Checkbox nur für Ausnahme-fähige Kategorien (nicht Training/Zeitblock)", () => {
    render(<TagesEintragBearbeiten item={baueItem()} datum={DATUM} onClose={vi.fn()} />);
    expect(screen.getByText("Erledigt (nur heute)")).toBeInTheDocument();
  });

  it("versteckt die Erledigt-Checkbox für Training", () => {
    render(<TagesEintragBearbeiten item={baueItem({ kategorie: "training" })} datum={DATUM} onClose={vi.fn()} />);
    expect(screen.queryByText("Erledigt (nur heute)")).not.toBeInTheDocument();
  });

  it("versteckt die Erledigt-Checkbox für Zeitblock", () => {
    render(<TagesEintragBearbeiten item={baueItem({ kategorie: "zeitblock" })} datum={DATUM} onClose={vi.fn()} />);
    expect(screen.queryByText("Erledigt (nur heute)")).not.toBeInTheDocument();
  });

  it("versteckt die Erledigt-Checkbox für Workflow (kannErledigt = kannAusnahme && kategorie !== workflow)", () => {
    render(<TagesEintragBearbeiten item={baueItem({ kategorie: "workflow" })} datum={DATUM} onClose={vi.fn()} />);
    expect(screen.queryByText("Erledigt (nur heute)")).not.toBeInTheDocument();
  });

  it("'Erledigt'-Checkbox ruft die richtige Toggle-Funktion je Kategorie auf", () => {
    render(<TagesEintragBearbeiten item={baueItem({ kategorie: "hormon", raw: { name: "Testosteron", uhrzeit: "08:00" } })} datum={DATUM} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Erledigt/ }));
    expect(toggleHormonErledigt).toHaveBeenCalledWith(DATUM, "Testosteron", "08:00");
  });

  it('"Heute anders" öffnet das Formular und speichert eine Ausnahme mit korrektem kategorie/refId', async () => {
    const onClose = vi.fn();
    render(<TagesEintragBearbeiten item={baueItem()} datum={DATUM} onClose={onClose} />);
    fireEvent.click(screen.getByText(/Heute anders/));
    const felder = screen.getAllByRole("textbox");
    fireEvent.change(felder[0], { target: { value: "09:30" } }); // Uhrzeit
    fireEvent.click(screen.getByText("Nur für heute speichern"));
    await vi.waitFor(() => expect(ausnahmeSetzen).toHaveBeenCalled());
    expect(ausnahmeSetzen).toHaveBeenCalledWith(
      expect.objectContaining({ kategorie: "supplement", refId: "s1", datum: DATUM, entfaellt: false })
    );
    // Bug-Fix-Beleg: genau dieser Aktion-String muss in
    // ProtokollLogView.jsx TAGESVERLAUF_AKTIONEN stehen, sonst verschwindet
    // die Änderung unsichtbar (siehe ProtokollLogView.test.jsx).
    expect(aenderungVermerken).toHaveBeenCalledWith(
      expect.objectContaining({ kategorie: "supplement", itemName: "Vitamin D", aktion: "geändert (nur dieser Tag)" })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('"Entfällt heute komplett" speichert eine Ausnahme mit entfaellt=true', async () => {
    render(<TagesEintragBearbeiten item={baueItem()} datum={DATUM} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Heute anders/));
    fireEvent.click(screen.getByText("Entfällt heute komplett"));
    fireEvent.click(screen.getByText("Nur für heute speichern"));
    await vi.waitFor(() => expect(ausnahmeSetzen).toHaveBeenCalled());
    expect(ausnahmeSetzen).toHaveBeenCalledWith(expect.objectContaining({ entfaellt: true, uhrzeit: null, name: null, detail: null }));
    expect(aenderungVermerken).toHaveBeenCalledWith(expect.objectContaining({ aktion: "entfällt (nur dieser Tag)" }));
  });

  it('"Ausnahme zurücknehmen" erscheint nur, wenn item.ausnahmeId gesetzt ist, und ruft ausnahmeEntfernen auf', async () => {
    render(<TagesEintragBearbeiten item={baueItem({ ausnahmeId: "ax1" })} datum={DATUM} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Heute anders/));
    fireEvent.click(screen.getByText(/Ausnahme zurücknehmen/));
    await vi.waitFor(() => expect(ausnahmeEntfernen).toHaveBeenCalledWith("ax1"));
    expect(aenderungVermerken).toHaveBeenCalledWith(expect.objectContaining({ aktion: "Ausnahme zurückgenommen" }));
  });

  it("zeigt den Ausnahme-Hinweis, wenn item.ausnahmeId gesetzt ist", () => {
    render(<TagesEintragBearbeiten item={baueItem({ ausnahmeId: "ax1" })} datum={DATUM} onClose={vi.fn()} />);
    expect(screen.getByText(/Für diesen Tag ist eine Ausnahme gespeichert/)).toBeInTheDocument();
  });

  // "Dauerhaft ändern"/"Zum Protokoll" → onNavigateKategorie mit korrektem Ziel
  // je Kategorie (Nutzerinnen-Frage: "für die Zukunft ändern" muss zum
  // richtigen Bereich führen).
  const ZIELE = [
    ["hormon", "medikamente", "Dauerhaft ändern"],
    ["supplement", "supplemente", "Dauerhaft ändern"],
    ["mahlzeit", "ernaehrung", "Dauerhaft ändern"],
    ["gewohnheit", "routinen", "Dauerhaft ändern"],
    ["workflow", "routinen", "Dauerhaft ändern"],
    ["training", "training", "Zum Protokoll"],
    ["zeitblock", "wochenuebersicht", "Zum Protokoll"],
  ];
  it.each(ZIELE)("kategorie %s navigiert per Knopf zu %s (Beschriftung enthält '%s')", (kategorie, ziel, beschriftungsTeil) => {
    const onNavigateKategorie = vi.fn();
    const onClose = vi.fn();
    render(<TagesEintragBearbeiten item={baueItem({ kategorie })} datum={DATUM} onNavigateKategorie={onNavigateKategorie} onClose={onClose} />);
    const knopf = screen.getByText(new RegExp(beschriftungsTeil));
    fireEvent.click(knopf);
    expect(onNavigateKategorie).toHaveBeenCalledWith(ziel);
    expect(onClose).toHaveBeenCalled();
  });
});
