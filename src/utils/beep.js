// Akustischer Alarm über die Web Audio API — keine externe Sounddatei nötig,
// funktioniert offline und zuverlässig direkt im Browser.
export function playBeep(count = 1) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    let time = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.3);
      time += 0.4;
    }
    setTimeout(() => ctx.close(), (count * 0.4 + 0.5) * 1000);
  } catch (err) {
    console.error(err);
  }
}

// Leiser, kurzer Klick — bewusst anders als playBeep() (höhere Frequenz,
// deutlich kürzer, leiser), damit er sich als Sekunden-Ticken anfühlt statt
// als weiterer Alarm. Für isometrisches Training (15.08., Nutzerin-Vorgabe:
// "die Zeit ticken hören mit jeder Sekunde").
export function playTick() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1600;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
    setTimeout(() => ctx.close(), 300);
  } catch (err) {
    console.error(err);
  }
}
