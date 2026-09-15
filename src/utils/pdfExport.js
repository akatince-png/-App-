import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Gleichmäßiger Druckrand für jeden PDF-Export app-weit (Nutzerinnen-
// Vorgabe, 15.09.: "die PDFs werden nicht sauber erstellt, die sind nicht
// gut zentriert ... alle Voreinstellungen so gestellt"). Vorher füllte das
// Bild randlos die komplette Seitenbreite UND wurde bei kurzem Inhalt oben
// an der Seite festgeklebt, statt mittig auf dem Blatt zu "sitzen" — bei
// einer kurzen Tagebuchseite oder einem einzelnen ausgefüllten
// Coaching-Formular (beide typischerweise deutlich kürzer als eine ganze
// A4-Seite) blieb dadurch unten sehr viel ungenutztes Weiß, während der
// eigentliche Inhalt oben "klebte" statt zentriert zu wirken. 15mm
// entspricht einem gängigen Druck-/Word-Standardrand.
const SEITENRAND_MM = 15;

// Fotografiert ein DOM-Element (das jeweilige unsichtbare Export-Raster,
// siehe WochenuebersichtView.jsx/TagebuchTab.jsx/AdminFormulareView.jsx)
// und packt es als A4-PDF, das automatisch heruntergeladen wird. Läuft
// komplett clientseitig, kein Node-PDF-Renderer nötig. Gibt zusätzlich die
// Daten-URL zurück, damit der Aufrufer daraus eine Vorschau-Miniatur
// zeigen kann, ohne ein zweites Mal zu rendern.
export async function exportElementAsPdf(element, filename = "protokoll.pdf") {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidthMm = pageWidth - SEITENRAND_MM * 2;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
  const nutzbareHoehe = pageHeight - SEITENRAND_MM * 2;

  if (imgHeightMm <= nutzbareHoehe) {
    // Passt auf eine einzelne Seite — mittig platzieren statt oben
    // anzukleben, damit z. B. eine kurze Tagebuchseite fertig gerahmt
    // wirkt statt oben abgeschnitten und unten leer.
    const y = SEITENRAND_MM + (nutzbareHoehe - imgHeightMm) / 2;
    pdf.addImage(imgData, "PNG", SEITENRAND_MM, y, imgWidthMm, imgHeightMm);
  } else {
    // Zu lang für eine Seite: seitenweise weiterblättern. Der linke/rechte
    // Rand bleibt auf jeder Seite gleich (fixer X-Versatz `SEITENRAND_MM`,
    // wirkt sich nicht auf die Zeilenaufteilung aus); oben/unten bleibt
    // bewusst randlos zwischen den Seiten (dieselbe Logik wie vorher, nur
    // mit dem schmaleren `imgWidthMm`) — ein echter Rand HIER würde
    // bedeuten, das durchgehende Bild in einzelne Seiten-Ausschnitte zu
    // zerschneiden statt es nur zu verschieben, was den Bild-Inhalt
    // angrenzender Seiten sichtbar in die Randzone bluten ließe.
    let heightLeft = imgHeightMm;
    let position = 0;
    pdf.addImage(imgData, "PNG", SEITENRAND_MM, position, imgWidthMm, imgHeightMm);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", SEITENRAND_MM, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeight;
    }
  }

  pdf.save(filename);
  return { dataUrl: imgData };
}
