import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { gsap } from 'gsap';
import { config, issueUrl } from '@byte/config.ts';
import { Actor, reduced } from './actor.ts';
import { buddy } from './buddy.ts';
import { chat } from './chat.ts';
import { projects, stack, timeline } from './data.ts';
import { fetchLive, type Live } from './live.ts';
import { setSound, soundOn } from './sound.ts';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const base = import.meta.env.BASE_URL;

// ── content ───────────────────────────────────────────────────────────
$('#projects').innerHTML = projects.map((p) => `<article class="card">
  <div class="copy"><h3><a href="${p.url}">${esc(p.title)}</a></h3><p>${esc(p.blurb)}.</p><ul class="chips">${p.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
  <div class="media"><video muted loop playsinline preload="none" poster="${base}media/${p.media}.png" aria-label="Preview animation for ${esc(p.title)}" width="400" height="300"><source src="${base}media/${p.media}.webm" type="video/webm"><source src="${base}media/${p.media}.mp4" type="video/mp4"></video></div>
</article>`).join('');
$('#groups').innerHTML = Object.entries(stack).map(([g, items]) => `<div class="group"><h3>${g}</h3><p>${(items as readonly string[]).map(esc).join(', ')}</p></div>`).join('');
$('#timeline').innerHTML = timeline.map((t) => `<li><h3>${esc(t.title)}</h3><p class="kind">${t.kind}</p><p>${esc(t.text)}</p></li>`).join('');
$<HTMLAnchorElement>('#enquiry').href = issueUrl('Project enquiry: ', 'Hi Nithin,\n\nWhat I want to build:\n\nWho will use it:\n\nWhen I need it by:\n\nAnything else:\n');

// Hover (or focus) a card to play its preview. On touch screens the card plays while it is on screen.
const hover = matchMedia('(hover: hover)').matches;
for (const card of document.querySelectorAll<HTMLElement>('.card')) {
  const v = card.querySelector('video')!, play = () => { if (!reduced()) v.play().catch(() => {}); }, stop = () => v.pause();
  if (hover) { card.addEventListener('pointerenter', play); card.addEventListener('pointerleave', stop); card.addEventListener('focusin', play); card.addEventListener('focusout', stop); }
  else new IntersectionObserver(([e]) => (e.intersectionRatio > 0.6 ? play() : stop()), { threshold: [0, 0.6] }).observe(card);
}

// ── Byte ──────────────────────────────────────────────────────────────
const actor = new Actor($('#stage'), $('#byte'), $('#bubble'));
let live: Live | null = null;
chat($<HTMLFormElement>('#chat'), actor, () => live);
fetchLive().then((l) => {
  live = l; if (!l) return;
  actor.setLook(l.level, l.accessories?.wearing ?? null);
  $('#live').innerHTML = `On <a href="https://github.com/${config.user}">my GitHub profile</a> right now, Byte is level ${l.level}, feeling ${esc(l.mood)}, with ${l.pets.total} pets from visitors. <a href="${issueUrl('byte|pet')}">Pet him there too</a>.`;
});
const howto = $('#howto'); let tries = 0;
actor.onChange = () => { if (++tries === 3) howto.classList.add('done'); };

// The cookie: drag it to Byte's mouth, or just press it.
const cookie = $<HTMLButtonElement>('#cookie');
cookie.addEventListener('pointerdown', (e) => {
  e.preventDefault(); cookie.setPointerCapture(e.pointerId);
  const sx = e.clientX, sy = e.clientY; let moved = false;
  const move = (ev: PointerEvent) => { const dx = ev.clientX - sx, dy = ev.clientY - sy; if (Math.hypot(dx, dy) > 6) moved = true; cookie.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 4}deg)`; };
  const up = (ev: PointerEvent) => {
    cookie.removeEventListener('pointermove', move); cookie.removeEventListener('pointerup', up);
    const m = actor.mouth(), hit = Math.hypot(ev.clientX - m.x, ev.clientY - m.y) < m.r * 1.6;
    if (!moved || hit) { eat(!moved); return; }
    // Missed: the cookie hops back into the jar.
    const [, dx, dy] = /translate\((-?[\d.]+)px,(-?[\d.]+)px\)/.exec(cookie.style.transform) ?? [0, '0', '0'];
    cookie.style.transform = ''; gsap.fromTo(cookie, { x: +dx, y: +dy }, { x: 0, y: 0, rotation: 0, duration: reduced() ? 0 : 0.5, ease: 'back.out(2)', clearProps: 'transform' });
  };
  cookie.addEventListener('pointermove', move); cookie.addEventListener('pointerup', up);
});
cookie.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); eat(true); } });
function eat(fly: boolean) {
  const done = () => { actor.feed(); cookie.style.transform = ''; gsap.set(cookie, { clearProps: 'all' }); if (!reduced()) gsap.from(cookie, { scale: 0, duration: 0.5, delay: 0.6, ease: 'back.out(3)' }); };
  if (!fly || reduced()) { cookie.style.opacity = '0'; setTimeout(() => { cookie.style.opacity = ''; done(); }, 50); return; }
  const c = cookie.getBoundingClientRect(), m = actor.mouth();
  gsap.timeline({ onComplete: done }).to(cookie, { x: m.x - (c.left + c.width / 2), duration: 0.6, ease: 'none' }, 0).to(cookie, { y: m.y - (c.top + c.height / 2) - 80, duration: 0.3, ease: 'power2.out' }, 0).to(cookie, { y: m.y - (c.top + c.height / 2), scale: 0.3, duration: 0.3, ease: 'power2.in' }, 0.3);
}

// ── sound toggle ──────────────────────────────────────────────────────
const sound = $<HTMLButtonElement>('.sound');
const paint = () => { sound.setAttribute('aria-pressed', String(soundOn())); sound.textContent = soundOn() ? 'Sound on' : 'Sound off'; };
sound.addEventListener('click', () => { setSound(!soundOn()); paint(); }); paint();

// ── the one orchestrated entrance: the name rises, then the role line starts turning ──
const roles = ['websites', 'dashboards', 'AI tools', 'apps'], rot = $('.rot');
if (!reduced()) {
  gsap.from('.intro > *', { y: 28, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' });
  let i = 0;
  setInterval(() => {
    i = (i + 1) % roles.length;
    gsap.timeline().to(rot, { yPercent: -60, opacity: 0, duration: 0.25, ease: 'power2.in' }).add(() => { rot.textContent = roles[i]; }).fromTo(rot, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'back.out(2)' });
  }, 2600);
}
buddy($<HTMLButtonElement>('#buddy'), $('.hero'), $('#contact'));
