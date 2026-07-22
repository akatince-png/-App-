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
