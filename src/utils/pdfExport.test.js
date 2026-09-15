import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportElementAsPdf } from "./pdfExport";

// html2canvas/jsPDF machen im Test-DOM (jsdom, kein echtes Canvas-Rendering)
// nichts Sinnvolles — beide gemockt, damit exportElementAsPdf() sich rein
// auf die eigene Positions-/Seitenrand-Rechnung testen lässt (Nutzerinnen-
// Vorgabe, 15.09.: PDFs wirkten "nicht gut zentriert"). Die eigentliche
// visuelle Korrektheit wurde zusätzlich einmalig empirisch mit einer echten,
// im Browser erzeugten PDF-Datei (Playwright + pdfplumber) nachgemessen —
// exakt gleiche Ränder links/rechts und oben/unten bestätigt.
// vi.mock()-Factorys werden über alle top-level Imports hinweg gehoistet —
// die referenzierten Mocks müssen deshalb über vi.hoisted() entstehen,
// sonst "Cannot access ... before initialization".
const { addImageMock, addPageMock, saveMock, html2canvasMock } = vi.hoisted(() => ({
  addImageMock: vi.fn(),
  addPageMock: vi.fn(),
  saveMock: vi.fn(),
  html2canvasMock: vi.fn(),
}));

vi.mock("jspdf", () => {
  // Bewusst eine normale `function` statt vi.fn().mockImplementation(...)
  // — jsPDF wird per `new jsPDF(...)` aufgerufen, und nur eine echte
  // (auch simple) Konstruktorfunktion, die ihr Ergebnis per `return`
  // liefert, verhält sich mit `new` zuverlässig wie erwartet.
  function FakeJsPDF() {
    return {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addImage: addImageMock,
      addPage: addPageMock,
      save: saveMock,
    };
  }
  return { default: FakeJsPDF };
});

vi.mock("html2canvas", () => ({ default: html2canvasMock }));

// canvas.width/height bestimmen das Bild-Seitenverhältnis — toDataURL wird
// nie wirklich ausgewertet (jsPDF ist gemockt), der Inhalt ist beliebig.
function fakeCanvas(width, height) {
  return { width, height, toDataURL: () => "data:image/png;base64,xxx" };
}

describe("exportElementAsPdf", () => {
  beforeEach(() => {
    addImageMock.mockClear();
    addPageMock.mockClear();
    saveMock.mockClear();
  });

  it("platziert ein kurzes Element mittig auf einer einzelnen Seite (gleicher Rand oben/unten, links/rechts)", async () => {
    // Seitenrand 15mm -> Breite 210-30=180mm. Seitenverhältnis 900x300 ->
    // Bildhöhe = 180 * 300/900 = 60mm, nutzbare Höhe = 297-30=267mm, passt
    // also klar auf eine Seite.
    html2canvasMock.mockResolvedValue(fakeCanvas(900, 300));

    await exportElementAsPdf({}, "test.pdf");

    expect(addPageMock).not.toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalledTimes(1);
    const [, , x, y, w, h] = addImageMock.mock.calls[0];
    expect(x).toBe(15);
    expect(w).toBeCloseTo(180, 5);
    expect(h).toBeCloseTo(60, 5);
    // Mittig: Rand oben = Rand unten = (267 - 60) / 2 + 15 = 118.5
    expect(y).toBeCloseTo(118.5, 5);
    expect(saveMock).toHaveBeenCalledWith("test.pdf");
  });

  it("blättert bei einem langen Element seitenweise weiter, mit demselben Seitenrand links auf jeder Seite", async () => {
    // Sehr hohes Bild (900x3000) -> Bildhöhe = 180 * 3000/900 = 600mm,
    // deutlich mehr als eine A4-Seite (297mm) -> mehrseitig.
    html2canvasMock.mockResolvedValue(fakeCanvas(900, 3000));

    await exportElementAsPdf({}, "lang.pdf");

    expect(addPageMock.mock.calls.length).toBeGreaterThan(0);
    expect(addImageMock.mock.calls.length).toBeGreaterThan(1);
    // Auf jeder Seite derselbe linke Rand und dieselbe (volle) Breite.
    for (const call of addImageMock.mock.calls) {
      const [, , x, , w] = call;
      expect(x).toBe(15);
      expect(w).toBeCloseTo(180, 5);
    }
  });
});
