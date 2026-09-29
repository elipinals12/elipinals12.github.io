// shared helpers for tts + stt pages
export const $ = id => document.getElementById(id);
export const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const fmt = s => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
};

// status line: setStat(el, msg, 'on'|'err')
export const setStat = (el, m, t = '') => { el.textContent = m; el.className = 'stat' + (t ? ' ' + t : ''); };

// progress bar with fill + pct + label elements; returns setter(pct, text)
export const barSetter = (fill, pct, txt) => (p, t) => {
  const v = Math.round(Math.min(100, Math.max(0, p)));
  fill.style.width = v + '%';
  pct.textContent = v + '%';
  if (t) txt.textContent = t;
};

// localStorage that never throws (private mode / blocked storage)
export const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

// clipboard w/ fallback for older Safari / non-secure contexts
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  return ok;
}

// wire a settings gear button to its drawer
export function wireGear(btn, drawer) {
  btn.addEventListener('click', () => { btn.classList.toggle('open'); drawer.classList.toggle('open'); });
}
