import { gsap } from 'gsap';
import { byte, stageFor, type Fx, type Mood } from '@byte/lib/byte.ts';
import { themes, type Theme } from '@byte/lib/theme.ts';
import { beep } from './sound.ts';

const VB = { x: -95, y: -185, w: 190, h: 196 };          // Byte's viewBox; feet sit at y = 0
const dark = matchMedia('(prefers-color-scheme: dark)'), still = matchMedia('(prefers-reduced-motion: reduce)');
export const theme = (): Theme => themes[dark.matches ? 'dark' : 'light'];
export const reduced = () => still.matches;

/**
 * The big interactive Byte in the hero. Owns position and physics, picks the mood from what the visitor is doing,
 * and redraws the SVG with the shared generator whenever the mood, look or theme changes.
 */
export class Actor {
  x = 0; y = -400; vx = 0; vy = 0; size = 1;
  private dragging = false; private resting = false; private raf = 0; private last = 0;
  private grab = { dx: 0, dy: 0, t: 0, px: 0, py: 0 };
  private temp: { mood: Mood | 'dance'; fx: Fx; until: number } | null = null;
  private drawn = ''; private eyes: SVGGElement | null = null; private body!: HTMLDivElement;
  private active = performance.now(); private petAcc = 0; private petLast = 0; private petCool = 0;
  private look = { stage: 0, wearing: null as string | null };
  private bubbleTimer = 0;
  pets = 0; onChange: (msg: string) => void = () => {};

  constructor(private stage: HTMLElement, private el: HTMLElement, private bubble: HTMLElement) {
    this.body = document.createElement('div'); this.body.className = 'byte-body'; el.append(this.body);
    this.measure(); this.x = this.stage.clientWidth * 0.62; this.draw(true);
    new ResizeObserver(() => { this.measure(); this.clamp(); this.place(); }).observe(stage);
    dark.addEventListener('change', () => this.draw(true));
    this.bind();
    setInterval(() => this.draw(), 1000);                 // idle → sleepy → asleep checks
    if (reduced()) { this.y = this.floor; this.resting = true; this.place(); } else this.kick();
  }

  // ── geometry ────────────────────────────────────────────────────────
  get floor() { return this.stage.clientHeight - parseFloat(getComputedStyle(this.stage).getPropertyValue('--floor') || '64'); }
  get w() { return VB.w * this.size; } get h() { return VB.h * this.size; }
  private measure() { this.size = Math.max(0.78, Math.min(1.35, this.stage.clientWidth / 520)); this.el.style.width = `${this.w}px`; this.el.style.height = `${this.h}px`; }
  private clamp() { this.x = Math.max(this.w * 0.42, Math.min(this.stage.clientWidth - this.w * 0.42, this.x)); if (this.resting || this.y > this.floor) this.y = this.floor; }
  private place() {
    this.el.classList.toggle('air', this.y < this.floor - 3);
    this.el.style.transform = `translate(${this.x - this.w / 2}px, ${this.y - (-VB.y / VB.h) * this.h}px)`;
    if (this.bubble.classList.contains('on')) {
      const bw = this.bubble.offsetWidth, left = Math.max(bw / 2 + 8, Math.min(this.stage.clientWidth - bw / 2 - 8, this.x));
      this.bubble.style.transform = `translate(${left - bw / 2}px, ${Math.max(8, this.y - this.h * 0.92 - this.bubble.offsetHeight)}px)`;
    }
  }

  // ── drawing ─────────────────────────────────────────────────────────
  setLook(level: number, wearing: string | null) { this.look = { stage: stageFor(level), wearing }; this.draw(true); }
  private mood(): { mood: Mood | 'dance'; fx: Fx } {
    const now = performance.now();
    if (this.temp && this.temp.until > now) return this.temp;
    this.temp = null;
    if (this.dragging) return { mood: 'happy', fx: null };
    const idle = now - this.active;
    return { mood: idle > 120_000 ? 'sleeping' : idle > 60_000 ? 'sleepy' : 'idle', fx: null };
  }
  private draw(force = false) {
    const m = this.mood(), key = `${m.mood}|${m.fx}|${this.look.stage}|${this.look.wearing}|${dark.matches}`;
    if (key === this.drawn && !force) return;
    if (m.mood === 'sleepy' && !this.drawn.startsWith('sleepy')) beep('yawn');
    this.drawn = key;
    const b = byte({ t: theme(), mood: m.mood, fx: m.fx, stage: this.look.stage, wearing: this.look.wearing, x: 0, y: 0, id: 'by' });
    this.body.innerHTML = `<svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" width="100%" height="100%" aria-hidden="true"><style>${b.css}@media (prefers-reduced-motion: reduce){.byte-body *{animation:none!important}}</style>${b.svg}</svg>`;
    this.eyes = this.body.querySelector('.by-eyes');
  }
  private feel(mood: Mood | 'dance', ms: number, fx: Fx = null) { this.temp = { mood, fx, until: performance.now() + ms }; this.draw(); setTimeout(() => this.draw(), ms + 30); }
  wake() { const was = performance.now() - this.active > 60_000; this.active = performance.now(); if (was) { this.feel('excited', 900); this.hop(); this.say('Huh? I am awake. I was just resting my pixels.'); } else this.draw(); }

  say(text: string, ms = Math.max(2600, text.length * 55)) {
    this.bubble.textContent = text; this.bubble.classList.add('on'); this.place();
    clearTimeout(this.bubbleTimer); this.bubbleTimer = window.setTimeout(() => this.bubble.classList.remove('on'), ms);
  }

  // ── physics ─────────────────────────────────────────────────────────
  private kick() { this.resting = false; if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); } }
  private tick = (now: number) => {
    const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now; this.raf = 0;
    if (this.dragging) return;
    this.vy += 2600 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
    const minX = this.w * 0.42, maxX = this.stage.clientWidth - this.w * 0.42, top = this.h * 0.9;
    if (this.x < minX) { this.x = minX; this.vx = Math.abs(this.vx) * 0.5; this.bonk(); }
    if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx) * 0.5; this.bonk(); }
    if (this.y < top && this.vy < 0) { this.y = top; this.vy *= -0.3; }
    if (this.y >= this.floor) {
      this.y = this.floor;
      if (this.vy > 380) { this.squash(Math.min(1, this.vy / 2200)); this.vy = -this.vy * 0.42; if (this.vy < -900) { this.feel('excited', 1500); beep('boing'); } else beep('hop'); }
      else this.vy = 0;
      this.vx -= this.vx * Math.min(1, 7 * dt);
    }
    gsap.set(this.body, { rotation: Math.max(-18, Math.min(18, this.vx * 0.012)) * (this.y < this.floor ? 1 : 0.3) });
    this.place();
    if (this.y >= this.floor && this.vy === 0 && Math.abs(this.vx) < 6) { this.vx = 0; this.resting = true; gsap.to(this.body, { rotation: 0, duration: 0.4, ease: 'back.out(3)' }); return; }
    this.raf = requestAnimationFrame(this.tick);
  };
  private squash(k: number) {
    if (reduced()) return;
    gsap.timeline().to(this.body, { scaleX: 1 + 0.28 * k, scaleY: 1 - 0.24 * k, duration: 0.07, ease: 'power2.out', transformOrigin: '50% 95%' }).to(this.body, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1, 0.35)' });
  }
  private bonk() { if (!reduced()) gsap.fromTo(this.body, { scaleX: 0.86 }, { scaleX: 1, duration: 0.4, ease: 'elastic.out(1,0.4)', transformOrigin: '50% 60%' }); }
  hop() { if (reduced() || !this.resting) return; this.vy = -620; this.kick(); }

  // ── visitor input ───────────────────────────────────────────────────
  private local(e: PointerEvent) { const r = this.stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  private bind() {
    const el = this.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId); this.wake();
      const p = this.local(e); this.dragging = true; this.resting = false; cancelAnimationFrame(this.raf); this.raf = 0;
      this.grab = { dx: this.x - p.x, dy: this.y - p.y, t: performance.now(), px: p.x, py: p.y }; this.vx = this.vy = 0;
      el.classList.add('held'); this.draw(); if (!reduced()) gsap.to(this.body, { scaleY: 1.08, scaleX: 0.94, duration: 0.25, ease: 'back.out(3)', transformOrigin: '50% 10%' });
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const p = this.local(e), now = performance.now(), dt = Math.max(8, now - this.grab.t) / 1000;
      // Keep a smoothed velocity so a quick flick at the end of a drag becomes a throw.
      this.vx = this.vx * 0.5 + ((p.x - this.grab.px) / dt) * 0.5; this.vy = this.vy * 0.5 + ((p.y - this.grab.py) / dt) * 0.5;
      this.grab.t = now; this.grab.px = p.x; this.grab.py = p.y;
      this.x = p.x + this.grab.dx; this.y = Math.min(this.floor, p.y + this.grab.dy); this.clampX();
      gsap.set(this.body, { rotation: Math.max(-25, Math.min(25, -this.vx * 0.02)) });
      this.place();
    });
    const drop = () => {
      if (!this.dragging) return;
      this.dragging = false; el.classList.remove('held'); gsap.to(this.body, { scaleX: 1, scaleY: 1, duration: 0.3 });
      if (performance.now() - this.grab.t > 90) { this.vx = 0; this.vy = 0; }      // held still before letting go: just drop
      this.vx = Math.max(-2600, Math.min(2600, this.vx)); this.vy = Math.max(-2600, Math.min(2600, this.vy));
      if (reduced()) { this.vx = this.vy = 0; this.y = this.floor; this.resting = true; this.place(); this.draw(); return; }
      if (Math.hypot(this.vx, this.vy) > 1400) this.say(['Wheee!', 'Again! Again!', 'I can fly!', 'Beep beep boing!'][Math.floor(Math.random() * 4)], 1400);
      this.draw(); this.kick();
    };
    el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
    el.addEventListener('dblclick', () => this.dance());
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.pet(); }
      if (e.key.toLowerCase() === 'd') this.dance();
    });

    // Stroking (moving over Byte without pressing) counts as petting.
    el.addEventListener('pointermove', (e) => {
      if (this.dragging || e.buttons || e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - this.petLast > 400) this.petAcc = 0;
      this.petAcc += Math.min(40, Math.hypot(e.movementX, e.movementY));   // one big jump is not a stroke
      this.petLast = now;
      if (this.petAcc > 260 && now > this.petCool) { this.petAcc = 0; this.petCool = now + 1100; this.pet(); }
    });
    // Touch: a long, slow press-and-wiggle is hard on phones, so a simple tap pets.
    el.addEventListener('click', (e) => { if ((e as PointerEvent).pointerType === 'touch' && performance.now() - this.grab.t < 250) this.pet(); });

    // Eyes follow the pointer anywhere on the page.
    addEventListener('pointermove', (e) => {
      if (!this.eyes) return;
      const r = this.el.getBoundingClientRect(), k = r.width / VB.w;
      const ex = r.left + (0 - VB.x) * k, ey = r.top + (-66 - VB.y) * k, dx = e.clientX - ex, dy = e.clientY - ey, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 160) * 5;
      this.eyes.setAttribute('transform', `translate(${((dx / d) * m).toFixed(2)},${((dy / d) * m * 0.8).toFixed(2)})`);
    }, { passive: true });
    for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) addEventListener(ev, () => this.wake(), { passive: true });
    this.stage.addEventListener('pointermove', () => this.wake(), { passive: true });   // a hand near Byte wakes him; the rest of the page does not
  }
  private clampX() { this.x = Math.max(this.w * 0.42, Math.min(this.stage.clientWidth - this.w * 0.42, this.x)); }

  pet() {
    this.wake(); this.pets++; beep('pet'); this.feel('happy', 2600, 'hearts'); this.hearts();
    this.say(['Purr.exe running.', 'That is the good spot.', 'Happiness: 100%.', '*wiggles antenna*', 'Beep! More please.'][this.pets % 5], 1800);
    this.onChange('pet');
  }
  feed() { this.wake(); beep('nom'); this.feel('happy', 2600, 'crumbs'); this.say(['Nom nom nom.', 'Cookie compiled successfully.', 'Crunchy! 10 out of 10.'][Math.floor(Math.random() * 3)], 1800); this.hop(); this.onChange('feed'); }
  dance() { this.wake(); beep('dance'); this.feel('dance', 3600, 'notes'); this.say('Doing the robot. Obviously.', 1800); this.onChange('dance'); }
  talk(text: string) { this.wake(); beep('talk'); this.feel('happy', 1800); this.say(text); }
  /** Where a dropped cookie should land, in page coordinates. */
  mouth() { const r = this.el.getBoundingClientRect(), k = r.width / VB.w; return { x: r.left + (0 - VB.x) * k, y: r.top + (-50 - VB.y) * k, r: 70 * k }; }

  private hearts() {
    const t = theme();
    for (let i = 0; i < 4; i++) {
      const h = document.createElement('span'); h.className = 'heart';
      h.innerHTML = `<svg viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0,6 C-11,-3 -6,-11 0,-5 C6,-11 11,-3 0,6Z" fill="${t.accent}" stroke="${t.ink}" stroke-width="1.6"/></svg>`;
      this.stage.append(h);
      const sx = this.x + (i - 1.5) * 26 * this.size, sy = this.y - this.h * 0.75;
      if (reduced()) { gsap.set(h, { x: sx, y: sy - 20 }); setTimeout(() => h.remove(), 900); continue; }
      gsap.fromTo(h, { x: sx, y: sy, scale: 0.3, opacity: 0 }, { x: sx + (i - 1.5) * 18, y: sy - 90 - i * 14, scale: 1 + i * 0.1, opacity: 1, duration: 0.5, delay: i * 0.08, ease: 'back.out(2)', onComplete: () => gsap.to(h, { y: '-=40', opacity: 0, duration: 0.6, onComplete: () => h.remove() }) });
    }
  }
}
