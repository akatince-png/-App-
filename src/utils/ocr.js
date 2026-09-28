// Texterkennung auf dem Gerät (tesseract.js, 28.09.): kein KI-Dienst, kein
// Gemini-Kontingent, das Foto verlässt das Handy nicht. Beim ersten Mal
// lädt die App einmalig die deutschen Sprachdaten (ca. 2 MB) nach.
// Tests können window.__ocrMock setzen (liefert den erkannten Text).

// Ausschnitt vorbereiten: vergrößern, Graustufen, Kontrast – hilft der
// Erkennung bei Handyfotos deutlich.
export function ausschnittVorbereiten(bild, rahmen) {
  const sx = Math.round(rahmen.x * bild.naturalWidth);
  const sy = Math.round(rahmen.y * bild.naturalHeight);
  const sw = Math.max(1, Math.round(rahmen.w * bild.naturalWidth));
  const sh = Math.max(1, Math.round(rahmen.h * bild.naturalHeight));
  const faktor = Math.min(3, Math.max(1, 1600 / sw));
  const c = document.createElement("canvas");
  c.width = Math.round(sw * faktor);
  c.height = Math.round(sh * faktor);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bild, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const daten = ctx.getImageData(0, 0, c.width, c.height);
  const p = daten.data;
  for (let i = 0; i < p.length; i += 4) {
    const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    const k = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128));
    p[i] = p[i + 1] = p[i + 2] = k;
  }
  ctx.putImageData(daten, 0, 0);
  return c;
}

// Den markierten Rahmen in `anzahl` gleich breite Tages-Zellen teilen und
// jede Zelle einzeln lesen. Das klappt auch bei einzelnen Kürzeln („F“, „X“)
// und leeren Zellen, und kein Tag verrutscht. Liefert den Text je Zelle.
export async function zellenErkennen(canvas, anzahl, onFortschritt) {
  if (typeof window !== "undefined" && Array.isArray(window.__ocrMock)) return window.__ocrMock;
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("deu");
  const breite = canvas.width / anzahl;
  const rand = Math.round(breite * 0.02);
  const zellen = [];
  try {
    for (let i = 0; i < anzahl; i++) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(breite - 2 * rand)) + 40;
      c.height = canvas.height + 40;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, Math.round(i * breite + rand), 0, c.width - 40, canvas.height, 20, 20, c.width - 40, canvas.height);
      // Erst als Zeile lesen (Zeitspannen), bei nichts als einzelnes Zeichen.
      await worker.setParameters({ tessedit_pageseg_mode: "7" });
      let text = (await worker.recognize(c)).data.text.trim();
      if (!text || text.length <= 2) {
        await worker.setParameters({ tessedit_pageseg_mode: "10" });
        const einzeln = (await worker.recognize(c)).data.text.trim();
        if (einzeln) text = einzeln;
      }
      zellen.push(text);
      onFortschritt?.(Math.round(((i + 1) / anzahl) * 100));
    }
    return zellen;
  } finally {
    await worker.terminate();
  }
}
