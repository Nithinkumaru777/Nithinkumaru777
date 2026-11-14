const BLOCK = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'slut', 'whore', 'nigg', 'fag', 'retard', 'rape', 'porn', 'sex', 'nazi', 'kill yourself', 'kys', 'madarchod', 'bhenchod', 'chutiya', 'bhosdi', 'gandu', 'randi', 'lodu'];
const LINK = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|in|co|dev|app|xyz|ly|me|gg|ru|cn)\b|@[a-z0-9_-]{2,})/i;
const squash = (s: string) => s.toLowerCase().replace(/[@4]/g, 'a').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/3/g, 'e').replace(/[$5]/g, 's').replace(/[^a-z ]/g, '');

/** Clean a guestbook message. Returns null when it should not be shown at all. */
export function cleanMessage(raw: string, max = 80): string | null {
  if (/<\/?[a-z!]/i.test(raw)) return null;              // markup is never a greeting
  const text = raw.replace(/[\u0000-\u001f<>`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text || LINK.test(text)) return null;
  const flat = squash(text), tight = flat.replace(/ /g, '');
  if (BLOCK.some((w) => flat.includes(w) || tight.includes(w.replace(/ /g, '')))) return null;
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}
