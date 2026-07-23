export default function playSound(type: 'positive' | 'negative' | 'redmark' | 'store') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    if (type === 'positive') {
      o.frequency.setValueAtTime(520, ctx.currentTime); o.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
      g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
    } else if (type === 'negative') {
      o.frequency.setValueAtTime(300, ctx.currentTime); o.frequency.setValueAtTime(200, ctx.currentTime + 0.15)
      g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(); o.stop(ctx.currentTime + 0.3)
    } else if (type === 'redmark') {
      o.frequency.setValueAtTime(200, ctx.currentTime); o.frequency.setValueAtTime(150, ctx.currentTime + 0.2)
      g.gain.setValueAtTime(0.4, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      o.start(); o.stop(ctx.currentTime + 0.5)
    } else if (type === 'store') {
      o.frequency.setValueAtTime(600, ctx.currentTime); o.frequency.setValueAtTime(1000, ctx.currentTime + 0.2)
      g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      o.start(); o.stop(ctx.currentTime + 0.5)
    }
  } catch (e) {
    // swallow audio errors in unsupported environments
  }
}
