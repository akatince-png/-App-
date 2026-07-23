import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Fotografiert ein DOM-Element (das unsichtbare Export-Raster in
// WochenuebersichtView) und packt es mehrseitig als A4-PDF, das
// automatisch heruntergeladen wird. Läuft komplett clientseitig, kein
// Node-PDF-Renderer nötig. Gibt zusätzlich die Daten-URL zurück, damit der
// Aufrufer daraus eine Vorschau-Miniatur zeigen kann, ohne ein zweites Mal
// zu rendern.
export async function exportElementAsPdf(element, filename = "protokoll.pdf") {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidthMm = pageWidth;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  let heightLeft = imgHeightMm;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeightMm;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
  return { dataUrl: imgData };
}
