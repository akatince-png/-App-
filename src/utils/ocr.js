// Texterkennung auf dem Gerät (tesseract.js, 28.09.): kein KI-Dienst, kein
// Gemini-Kontingent, das Foto verlässt das Handy nicht. Beim ersten Mal
// lädt die App einmalig das Lese-Programm und die deutschen Sprachdaten nach.
// Tests können window.__ocrMock setzen (Text je Zelle).

// Otsu-Schwelle: trennt Schrift und Hintergrund automatisch, auch bei
// grauem Papier, Schatten oder schwachem Kontrast.
function otsuSchwelle(grau) {
  const hist = new Array(256).fill(0);
  for (const g of grau) hist[g]++;
  const n = grau.length;
  let summe = 0;
  for (let i = 0; i < 256; i++) summe += i * hist[i];
  let sB = 0;
  let wB = 0;
  let beste = 0;
  let schwelle = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = n - wB;
    if (!wF) break;
    sB += t * hist[t];
    const v = wB * wF * (sB / wB - (summe - sB) / wF) ** 2;
    if (v > beste) {
      beste = v;
      schwelle = t;
    }
  }
  return schwelle;
}

// Ausschnitt vorbereiten: vergrößern, Graustufen und eine Schwarz/Weiß-
// Maske. Die Tabellenlinien entfernt danach zelleSaeubern je Tag.
export function ausschnittVorbereiten(bild, rahmen) {
  const sx = Math.round(rahmen.x * bild.naturalWidth);
  const sy = Math.round(rahmen.y * bild.naturalHeight);
  const sw = Math.max(1, Math.round(rahmen.w * bild.naturalWidth));
  const sh = Math.max(1, Math.round(rahmen.h * bild.naturalHeight));
  const faktor = Math.min(4, Math.max(1, 2400 / sw, 90 / sh));
  const c = document.createElement("canvas");
  c.width = Math.round(sw * faktor);
  c.height = Math.round(sh * faktor);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bild, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const daten = ctx.getImageData(0, 0, c.width, c.height);
  const p = daten.data;
  const B = c.width;
  const H = c.height;
  const grau = new Uint8Array(B * H);
  for (let i = 0, j = 0; i < p.length; i += 4, j++) grau[j] = Math.round(0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]);
  // Örtliche Schwelle (Mittelwert der Umgebung): Schatten und ungleichmäßiges
  // Licht auf dem Foto stören so nicht. Gesamt-Schwelle (Otsu) als Untergrenze
  // gegen Rauschen auf leerem Papier.
  const global = otsuSchwelle(grau);
  const maske = new Uint8Array(B * H);
  const r = Math.max(8, Math.round(H * 0.35));
  const integral = new Float64Array((B + 1) * (H + 1));
  for (let y = 1; y <= H; y++) {
    let zeile = 0;
    for (let x = 1; x <= B; x++) {
      zeile += grau[(y - 1) * B + (x - 1)];
      integral[y * (B + 1) + x] = integral[(y - 1) * (B + 1) + x] + zeile;
    }
  }
  for (let y = 0; y < H; y++) {
    const ya = Math.max(0, y - r);
    const yb = Math.min(H, y + r + 1);
    for (let x = 0; x < B; x++) {
      const xa = Math.max(0, x - r);
      const xb = Math.min(B, x + r + 1);
      const summe = integral[yb * (B + 1) + xb] - integral[ya * (B + 1) + xb] - integral[yb * (B + 1) + xa] + integral[ya * (B + 1) + xa];
      const mittel = summe / ((yb - ya) * (xb - xa));
      const g = grau[y * B + x];
      maske[y * B + x] = g < mittel - 12 && g < global + 25 ? 1 : 0;
      const i = (y * B + x) * 4;
      p[i] = p[i + 1] = p[i + 2] = g;
      p[i + 3] = 255;
    }
  }
  ctx.putImageData(daten, 0, 0);
  // Schwarz/Weiß-Maske nur zum Finden von Linien und Schrift; gelesen wird
  // das Graubild (die Erkennung kommt mit weichen Kanten besser zurecht).
  c.maske = maske;
  return c;
}

// Lesedurchgänge je Zelle, vom allgemeinen zum gezielten. Der erste, dessen
// Ergebnis `passt`, gewinnt. Nur Ziffern bzw. Kürzel zuzulassen verhindert,
// dass ein unscharfes „F“ als „E“ oder „P“ gelesen wird.
// `sicher` = Mindest-Zuversicht der Erkennung (0–100); darunter wird nichts
// übernommen, damit nie ein Dienst geraten wird.
const DURCHGAENGE = [
  { sicher: 55, p: { tessedit_pageseg_mode: "7", tessedit_char_whitelist: "" } },
  { sicher: 60, p: { tessedit_pageseg_mode: "7", tessedit_char_whitelist: "0123456789:.-" } },
  { sicher: 70, p: { tessedit_pageseg_mode: "8", tessedit_char_whitelist: "FSNXUKfreiurlaubkrankRLAB" } },
  { sicher: 75, p: { tessedit_pageseg_mode: "10", tessedit_char_whitelist: "FSNXUK" } },
];

// Eine Tages-Zelle säubern: (auch leicht schräge) Tabellenlinien entfernen
// und nur den Schrift-Streifen in der Mitte ausschneiden – Reste der Zeile
// darüber oder darunter fliegen raus. Liefert null, wenn die Zelle leer ist.
export function zelleSaeubern(quelle, sx, sw) {
  const H = quelle.height;
  const B = Math.max(1, Math.round(sw));
  const X = Math.round(sx);
  const roh = quelle.getContext("2d").getImageData(X, 0, B, H).data;
  const d = new Uint8Array(B * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) d[y * B + x] = quelle.maske ? quelle.maske[y * quelle.width + X + x] : roh[(y * B + x) * 4] < 128 ? 1 : 0;
  const linie = new Uint8Array(B * H);
  // Linien = lange, durchgehende dunkle Strecken (Schrift hat Lücken
  // zwischen den Zeichen). Waagrecht ab 35 % der Zellbreite – so werden auch
  // leicht schräge Linien erkannt –, senkrecht ab 75 % der Höhe (± 2 px).
  const zeileAus = new Uint8Array(H);
  for (let y = 0; y < H; y++) {
    let lauf = 0;
    let max = 0;
    for (let x = 0; x < B; x++) {
      lauf = d[y * B + x] ? lauf + 1 : 0;
      if (lauf > max) max = lauf;
    }
    if (max > B * 0.35) for (let k = -2; k <= 2; k++) if (y + k >= 0 && y + k < H) zeileAus[y + k] = 1;
  }
  const spalteAus = new Uint8Array(B);
  for (let x = 0; x < B; x++) {
    let lauf = 0;
    let max = 0;
    for (let y = 0; y < H; y++) {
      lauf = d[y * B + x] ? lauf + 1 : 0;
      if (lauf > max) max = lauf;
    }
    if (max > H * 0.75) for (let k = -2; k <= 2; k++) if (x + k >= 0 && x + k < B) spalteAus[x + k] = 1;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      if (!zeileAus[y] && !spalteAus[x]) continue;
      d[y * B + x] = 0;
      linie[y * B + x] = 1;
    }
  }
  // Schrift-Streifen: zusammenhängende Zeilen mit Tinte; der Streifen, der
  // der Zellmitte am nächsten liegt (und nicht winzig ist), gewinnt.
  const tinte = new Array(H).fill(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) tinte[y] += d[y * B + x];
  const streifen = [];
  let start = -1;
  for (let y = 0; y <= H; y++) {
    const an = y < H && tinte[y] > 0;
    if (an && start < 0) start = y;
    if (!an && start >= 0) {
      let masse = 0;
      for (let k = start; k < y; k++) masse += tinte[k];
      streifen.push({ von: start, bis: y, masse });
      start = -1;
    }
  }
  const brauchbar = streifen.filter((st) => st.bis - st.von >= H * 0.12 && st.masse >= B * H * 0.002);
  if (!brauchbar.length) return null;
  const mitte = H / 2;
  const st = brauchbar.sort((a, b) => Math.abs((a.von + a.bis) / 2 - mitte) - Math.abs((b.von + b.bis) / 2 - mitte))[0];
  let x0 = B;
  let x1 = -1;
  for (let y = st.von; y < st.bis; y++) {
    for (let x = 0; x < B; x++) {
      if (!d[y * B + x]) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
    }
  }
  if (x1 < 0) return null;
  // Schrift-Streifen als Graubild (Linien weiß), Kontrast je Zelle strecken,
  // auf ca. 48 px Schrifthöhe bringen, mit weißem Rand.
  const y0 = Math.max(0, st.von - 3);
  const y1 = Math.min(H, st.bis + 3);
  const xa = Math.max(0, x0 - 3);
  const xb = Math.min(B - 1, x1 + 3);
  const bw = xb - xa + 1;
  const bh = y1 - y0;
  let min = 255;
  let max = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = xa; x <= xb; x++) {
      const g = roh[(y * B + x) * 4];
      if (g < min) min = g;
      if (g > max) max = g;
    }
  }
  const spanne = Math.max(1, max - min);
  const roh2 = document.createElement("canvas");
  roh2.width = bw;
  roh2.height = bh;
  const rctx = roh2.getContext("2d");
  const img = rctx.createImageData(bw, bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const q = (y + y0) * B + (x + xa);
      const g = linie[q] ? 255 : Math.round(((roh[q * 4] - min) / spanne) * 255);
      const i = (y * bw + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = 255;
    }
  }
  rctx.putImageData(img, 0, 0);
  const f = Math.min(4, Math.max(0.5, 48 / (st.bis - st.von)));
  const out = document.createElement("canvas");
  out.width = Math.round(bw * f) + 60;
  out.height = Math.round(bh * f) + 60;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(roh2, 30, 30, Math.round(bw * f), Math.round(bh * f));
  return out;
}

// Scharfe Schwarz/Weiß-Fassung einer gesäuberten Zelle (Otsu je Zelle) –
// bei weichen, unscharfen Kanten liest die Erkennung diese oft besser.
export function zelleScharf(zelle) {
  const c = document.createElement("canvas");
  c.width = zelle.width;
  c.height = zelle.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(zelle, 0, 0);
  const daten = ctx.getImageData(0, 0, c.width, c.height);
  const p = daten.data;
  const grau = new Uint8Array(c.width * c.height);
  for (let j = 0; j < grau.length; j++) grau[j] = p[j * 4];
  const s = otsuSchwelle(grau);
  for (let j = 0; j < grau.length; j++) p[j * 4] = p[j * 4 + 1] = p[j * 4 + 2] = grau[j] <= s ? 0 : 255;
  ctx.putImageData(daten, 0, 0);
  return c;
}

// Den markierten Rahmen in `anzahl` gleich breite Tages-Zellen teilen und
// jede Zelle einzeln lesen. Das klappt auch bei einzelnen Kürzeln („F“, „X“)
// und leeren Zellen, und kein Tag verrutscht. Liefert den Text je Zelle;
// was keinen Dienst ergibt (`passt`), bleibt leer statt geraten.
export async function zellenErkennen(canvas, anzahl, onFortschritt, passt = (t) => !!t) {
  if (typeof window !== "undefined" && Array.isArray(window.__ocrMock)) return window.__ocrMock;
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("deu");
  const breite = canvas.width / anzahl;
  const rand = Math.round(breite * 0.02);
  const zellen = [];
  try {
    for (let i = 0; i < anzahl; i++) {
      const c = zelleSaeubern(canvas, i * breite + rand, breite - 2 * rand);
      let text = "";
      if (c) {
        const fassungen = [c, zelleScharf(c)];
        suche: for (const bildFassung of fassungen) for (const d of DURCHGAENGE) {
          await worker.setParameters(d.p);
          const { data } = await worker.recognize(bildFassung);
          const t = data.text.trim();
          if (passt(t) && (data.confidence ?? 100) >= d.sicher) {
            text = t;
            break suche;
          }
        }
      }
      zellen.push(text);
      onFortschritt?.(Math.round(((i + 1) / anzahl) * 100));
    }
    return zellen;
  } finally {
    await worker.terminate();
  }
}
