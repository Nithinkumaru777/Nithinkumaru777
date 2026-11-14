import { gsap } from 'gsap';
import { byte, type Mood } from '@byte/lib/byte.ts';
import { reduced, theme } from './actor.ts';

/** A small Byte in the corner once the hero is out of view. It looks where you scroll and waves at the contact section. */
export function buddy(btn: HTMLButtonElement, hero: Element, contact: Element) {
  let mood: Mood = 'idle', wave = false, shown = false, eyes: SVGGElement | null = null, lastY = scrollY, lastT = performance.now(), calm = 0, drawn = '';
  const draw = () => {
    const key = `${mood}${wave}${theme().mode}`; if (key === drawn) return; drawn = key;
    const b = byte({ t: theme(), mood, wave, x: 0, y: 0, id: 'bd' });
    btn.innerHTML = `<svg viewBox="-80 -175 160 182" aria-hidden="true"><style>${b.css}</style>${b.svg}</svg>`;
    eyes = btn.querySelector('.bd-eyes');
  };
  draw();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { drawn = ''; draw(); });
  new IntersectionObserver(([e]) => {
    const show = !e.isIntersecting; if (show === shown) return; shown = show;
    if (show) { btn.hidden = false; if (!reduced()) gsap.fromTo(btn, { y: 140, rotation: -20 }, { y: 0, rotation: 0, duration: 0.7, ease: 'back.out(2)' }); }
    else if (reduced()) btn.hidden = true; else gsap.to(btn, { y: 140, duration: 0.35, ease: 'power2.in', onComplete: () => { btn.hidden = true; } });
  }).observe(hero);
  new IntersectionObserver(([e]) => { wave = e.isIntersecting; mood = wave ? 'happy' : 'idle'; draw(); }, { threshold: 0.4 }).observe(contact);
  addEventListener('scroll', () => {
    const now = performance.now(), v = (scrollY - lastY) / Math.max(16, now - lastT) * 1000; lastY = scrollY; lastT = now;
    eyes?.setAttribute('transform', `translate(0,${Math.max(-5, Math.min(5, v / 160)).toFixed(1)})`);
    if (!reduced()) gsap.to(btn, { rotation: Math.max(-14, Math.min(14, v / 140)), duration: 0.3, overwrite: 'auto' });
    if (Math.abs(v) > 3200 && !wave) { mood = 'excited'; draw(); }
    clearTimeout(calm); calm = window.setTimeout(() => { if (!reduced()) gsap.to(btn, { rotation: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }); eyes?.setAttribute('transform', ''); if (!wave) { mood = 'idle'; draw(); } }, 260);
  }, { passive: true });
  btn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }));
}
