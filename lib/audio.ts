'use client';

export function playAlertTone(type: 'missed' | 'declining') {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const ctx = new AudioContext();

    const frequencies = type === 'missed'
      ? [440, 523, 440, 523]
      : [392, 349, 330, 311];

    let startTime = ctx.currentTime;

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, startTime + i * 0.3);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + i * 0.3 + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + i * 0.3 + 0.25);

      oscillator.start(startTime + i * 0.3);
      oscillator.stop(startTime + i * 0.3 + 0.3);
    });
  } catch {
    // Web Audio API not available
  }
}
