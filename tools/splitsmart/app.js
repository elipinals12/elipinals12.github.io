// ====== CONFIG ======
// Paste your deployed Apps Script Web App URL here (see apps-script.gs).
const API_URL = 'https://script.google.com/macros/s/AKfycbzvoZfsXMvT72V_r3zw5m01ctD9mjMP1nYpXyQYyzBsuOLh9SK8hvqOFiLn0OY2XBeFDw/exec';

// ====== STATE ======
let partyCode = null;
let myId = null;
let members = {};      // id -> {name, payment:[...], firstSeen}
let events = [];        // raw event log
let pollTimer = null;

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }

// ====== MEMBER COLORS ======
// Soft, randomized-but-bounded hue so colors are never too dark or too bright,
// and are consistent for everyone since the hue is stored with the join event.
function randomMemberColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 15);  // 55-70%
  const l = 52 + Math.floor(Math.random() * 10);  // 52-62%
  return `hsl(${h} ${s}% ${l}%)`;
}
function memberColor(id) {
  return (members[id] && members[id].color) || 'var(--accent)';
}
function fallbackColor(id) {
  // deterministic hash-based hue for events saved before colors existed
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 62% 57%)`;
}
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// ====== API ======
async function apiGet(params) {
  const url = API_URL + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url);
  return res.json();
}
async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoid CORS preflight
    body: JSON.stringify(body)
  });
  return res.json();
}

// ====== LOCAL STORAGE (multi-party) ======
// splitsmart_parties: [{code, id}, ...] every party this device has joined/created.
// splitsmart_active: the code currently in view.
function loadPartyList() {
  try { return JSON.parse(localStorage.getItem('splitsmart_parties') || '[]'); } catch (e) { return []; }
}
function savePartyList(list) { localStorage.setItem('splitsmart_parties', JSON.stringify(list)); }
function upsertParty(code, id) {
  const list = loadPartyList();
  const i = list.findIndex(p => p.code === code);
  if (i >= 0) list[i].id = id; else list.push({ code, id });
  savePartyList(list);
  localStorage.setItem('splitsmart_active', code);
}
function removeParty(code) {
  savePartyList(loadPartyList().filter(p => p.code !== code));
  if (localStorage.getItem('splitsmart_active') === code) localStorage.removeItem('splitsmart_active');
}
function getActiveParty() {
  const list = loadPartyList();
  const active = localStorage.getItem('splitsmart_active');
  return list.find(p => p.code === active) || list[0] || null;
}

// ====== GATE (join/create) ======
let gateMode = 'create';
function setGateTab(mode) {
  gateMode = mode;
  $('#tabJoin').classList.toggle('active', mode === 'join');
  $('#tabCreate').classList.toggle('active', mode === 'create');
  $('#codeField').hidden = mode !== 'join';
  $('#gateSubmit').textContent = mode === 'join' ? 'Join party' : 'Create party';
}
$('#tabJoin').onclick = () => setGateTab('join');
$('#tabCreate').onclick = () => setGateTab('create');

// show/hide the optional detail field per payment method as it's checked
document.querySelectorAll('#paychecks input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', () => {
    const detail = document.querySelector(`.pay-detail[data-method="${cb.value}"]`);
    if (detail) detail.hidden = !cb.checked;
  });
});

$('#gateSubmit').onclick = async () => {
  const name = $('#nameInput').value.trim();
  const errBox = $('#gateErr');
  errBox.textContent = '';
  if (!name) { errBox.textContent = 'Enter your name.'; return; }
  const payment = Array.from(document.querySelectorAll('#paychecks input[type=checkbox]:checked')).map(c => {
    const detailEl = document.querySelector(`.pay-detail[data-method="${c.value}"]`);
    return { method: c.value, detail: detailEl ? detailEl.value.trim() : '' };
  });

  $('#gateSubmit').disabled = true;
  try {
    let code;
    if (gateMode === 'create') {
      const r = await apiPost({ action: 'create' });
      if (r.error) throw new Error(r.error);
      code = r.code;
    } else {
      code = $('#codeInput').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!/^[a-z0-9]{4,}$/.test(code)) { errBox.textContent = 'Enter the 3-word code, e.g. coralmarblequiver.'; $('#gateSubmit').disabled = false; return; }
      const r = await apiGet({ action: 'exists', code });
      if (!r.exists) { errBox.textContent = 'No party with that code.'; $('#gateSubmit').disabled = false; return; }
    }
    myId = uid();
    partyCode = code;
    const color = randomMemberColor();
    const r2 = await apiPost({ action: 'append', code: partyCode, event: { type: 'join', data: { id: myId, name, payment, color } } });
    if (r2.error) throw new Error(r2.error);
    upsertParty(partyCode, myId);
    await enterParty();
  } catch (e) {
    errBox.textContent = 'Something went wrong: ' + e.message;
  }
  $('#gateSubmit').disabled = false;
};

// ====== ENTER PARTY / RENDER ======
async function enterParty() {
  $('#gate').hidden = true;
  $('#mainScreen').hidden = false;
  $('#partyNameBtn').textContent = partyCode;
  $('#partyMenu').hidden = true;
  document.title = 'SplitSmart · ' + partyCode;
  await refresh();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refresh, 8000);
}

function showGate() {
  if (pollTimer) clearInterval(pollTimer);
  $('#mainScreen').hidden = true;
  $('#gate').hidden = false;
  $('#gateErr').textContent = '';
  $('#nameInput').value = '';
  $('#codeInput').value = '';
  document.title = 'SplitSmart';
  setGateTab('create');
}

async function switchToParty(code) {
  const entry = loadPartyList().find(p => p.code === code);
  if (!entry) return;
  partyCode = entry.code;
  myId = entry.id;
  localStorage.setItem('splitsmart_active', partyCode);
  await enterParty();
}

async function refresh() {
  const r = await apiGet({ action: 'events', code: partyCode });
  if (r.error) return;
  events = r.events;
  rebuildMembers();
  render();
}

function rebuildMembers() {
  members = {};
  for (const ev of events) {
    if (ev.type === 'join') {
      members[ev.data.id] = { name: ev.data.name, payment: ev.data.payment || [], color: ev.data.color || fallbackColor(ev.data.id) };
    }
  }
}

// ---- balance math ----
function computeNetBalances() {
  const net = {};
  for (const id in members) net[id] = 0;
  for (const ev of events) {
    if (ev.type === 'payment') {
      const { payerId, amount, splitAmong } = ev.data;
      if (!splitAmong || !splitAmong.length) continue;
      const share = amount / splitAmong.length;
      net[payerId] = (net[payerId] || 0) + amount;
      for (const pid of splitAmong) net[pid] = (net[pid] || 0) - share;
    } else if (ev.type === 'settle') {
      const { fromId, toId, amount } = ev.data;
      net[fromId] = (net[fromId] || 0) + amount;
      net[toId] = (net[toId] || 0) - amount;
    }
  }
  return net;
}

// greedy min-cash-flow simplification
function simplifyDebts(net) {
  const creditors = [], debtors = [];
  for (const id in net) {
    const v = Math.round(net[id] * 100) / 100;
    if (v > 0.005) creditors.push([id, v]);
    else if (v < -0.005) debtors.push([id, -v]);
  }
  creditors.sort((a, b) => b[1] - a[1]);
  debtors.sort((a, b) => b[1] - a[1]);
  const txns = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const amt = Math.min(creditors[ci][1], debtors[di][1]);
    if (amt > 0.005) txns.push({ from: debtors[di][0], to: creditors[ci][0], amount: amt });
    creditors[ci][1] -= amt;
    debtors[di][1] -= amt;
    if (creditors[ci][1] <= 0.005) ci++;
    if (debtors[di][1] <= 0.005) di++;
  }
  return txns;
}

function render() {
  $('#meName').textContent = (members[myId] && members[myId].name) || '?';
  renderBalances();
  renderFeed();
  populateSelects();
}

function renderBalances() {
  const net = computeNetBalances();
  const txns = simplifyDebts(net);
  const grid = $('#balGrid');
  grid.innerHTML = '';
  const ids = Object.keys(members).sort((a, b) => (a === myId ? -1 : b === myId ? 1 : members[a].name.localeCompare(members[b].name)));
  for (const id of ids) {
    if (id === myId) continue;
    const card = el('div', 'balcard');
    card.style.setProperty('--mc', memberColor(id));
    const who = el('div', 'who');
    const dot = el('div', 'dot', initials(members[id].name));
    dot.style.background = memberColor(id);
    who.appendChild(dot);
    who.appendChild(el('div', 'name', members[id].name));
    card.appendChild(who);
    const payEl = el('div', 'pay');
    for (const p of (members[id].payment || [])) {
      const isStr = typeof p === 'string';
      const label = isStr ? p : (p.detail ? `${p.method}: ${p.detail}` : p.method);
      const copyVal = isStr ? p : (p.detail || p.method);
      const line = el('div', 'pay-line', label + ' ');
      line.appendChild(el('span', 'pay-copy-icon', '⧉'));
      line.title = 'tap to copy';
      line.onclick = async () => { if (await copyText(copyVal)) flashButton(line, 'copied!'); };
      payEl.appendChild(line);
    }
    card.appendChild(payEl);
    // find edge between me and this person in simplified txns
    let amt = 0;
    for (const t of txns) {
      if (t.from === myId && t.to === id) amt -= t.amount;
      if (t.from === id && t.to === myId) amt += t.amount;
    }
    const amtEl = el('div', 'amt');
    if (Math.abs(amt) < 0.005) {
      amtEl.classList.add('zero');
      amtEl.textContent = 'settled up';
    } else if (amt > 0) {
      amtEl.classList.add('pos');
      amtEl.textContent = `owes you $${fmt(amt)}`;
    } else {
      amtEl.classList.add('neg');
      amtEl.textContent = `you owe $${fmt(-amt)}`;
    }
    card.appendChild(amtEl);
    grid.appendChild(card);
  }
  if (ids.length <= 1) grid.appendChild(el('div', 'empty', 'Waiting for others to join...'));
}

function renderFeed() {
  const list = $('#feedList');
  list.innerHTML = '';
  const sorted = [...events].sort((a, b) => new Date(b.ts) - new Date(a.ts));
  if (!sorted.length) { list.appendChild(el('div', 'empty', 'No activity yet.')); return; }
  for (const ev of sorted) {
    const item = el('div', 'feed-item');
    const actorId = actorIdOf(ev);
    const dot = el('div', 'dot');
    dot.style.background = memberColor(actorId);
    const ts = el('div', 'ts', formatTs(ev.ts));
    const desc = el('div', 'desc');
    desc.innerHTML = describeEvent(ev);
    item.appendChild(dot);
    item.appendChild(ts);
    item.appendChild(desc);
    list.appendChild(item);
  }
}

function nameOf(id) { return (members[id] && members[id].name) || 'someone'; }
function actorIdOf(ev) {
  if (ev.type === 'join' || ev.type === 'leave') return ev.data.id;
  if (ev.type === 'payment') return ev.data.payerId;
  if (ev.type === 'settle') return ev.data.fromId;
  return null;
}

function describeEvent(ev) {
  if (ev.type === 'join') return `<b>${escapeHtml(ev.data.name)}</b> joined the party`;
  if (ev.type === 'leave') return `<b>${escapeHtml(ev.data.name || nameOf(ev.data.id))}</b> left the party`;
  if (ev.type === 'payment') {
    const who = ev.data.splitAmong.map(nameOf).join(', ');
    return `<b>${escapeHtml(nameOf(ev.data.payerId))}</b> paid $${fmt(ev.data.amount)}${ev.data.note ? ' for ' + escapeHtml(ev.data.note) : ''} — split with ${escapeHtml(who)}`;
  }
  if (ev.type === 'settle') {
    return `<b>${escapeHtml(nameOf(ev.data.fromId))}</b> settled $${fmt(ev.data.amount)} to <b>${escapeHtml(nameOf(ev.data.toId))}</b>${ev.data.note ? ' (' + escapeHtml(ev.data.note) + ')' : ''}`;
  }
  return '';
}
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function formatTs(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function populateSelects() {
  const ids = Object.keys(members).sort((a, b) => members[a].name.localeCompare(members[b].name));
  const opts = ids.map(id => `<option value="${id}">${escapeHtml(members[id].name)}${id === myId ? ' (you)' : ''}</option>`).join('');
  $('#payPayer').innerHTML = opts;
  $('#payPayer').value = myId;
  $('#settleFrom').innerHTML = opts;
  $('#settleFrom').value = myId;
  $('#settleTo').innerHTML = opts;

  const splitList = $('#paySplitList');
  splitList.innerHTML = '';
  for (const id of ids) {
    const row = el('label', 'split-row');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.value = id; cb.checked = true;
    row.appendChild(cb);
    const sname = el('span', 'sname');
    const dot = el('span', 'dot');
    dot.style.background = memberColor(id);
    dot.style.width = '14px'; dot.style.height = '14px'; dot.style.fontSize = '0';
    sname.appendChild(dot);
    sname.appendChild(document.createTextNode(members[id].name + (id === myId ? ' (you)' : '')));
    row.appendChild(sname);
    splitList.appendChild(row);
  }
}

// ====== MODALS ======
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.onclick = () => $('#' + btn.dataset.close).classList.remove('open');
});
$('#openPaymentBtn').onclick = () => { $('#payErr').textContent = ''; $('#payNote').value = ''; $('#payAmount').value = ''; $('#paymentOverlay').classList.add('open'); };
$('#openSettleBtn').onclick = () => { $('#settleErr').textContent = ''; $('#settleAmount').value = ''; $('#settleNote').value = ''; $('#settleOverlay').classList.add('open'); };

$('#paySubmit').onclick = async () => {
  const note = $('#payNote').value.trim();
  const amount = parseFloat($('#payAmount').value);
  const payerId = $('#payPayer').value;
  const splitAmong = Array.from(document.querySelectorAll('#paySplitList input:checked')).map(c => c.value);
  const err = $('#payErr');
  if (!amount || amount <= 0) { err.textContent = 'Enter a valid amount.'; return; }
  if (!splitAmong.length) { err.textContent = 'Select at least one person to split with.'; return; }
  $('#paySubmit').disabled = true;
  try {
    const r = await apiPost({ action: 'append', code: partyCode, event: { type: 'payment', data: { payerId, amount, note, splitAmong } } });
    if (r.error) throw new Error(r.error);
    $('#paymentOverlay').classList.remove('open');
    await refresh();
  } catch (e) { err.textContent = 'Failed: ' + e.message; }
  $('#paySubmit').disabled = false;
};

$('#settleSubmit').onclick = async () => {
  const fromId = $('#settleFrom').value;
  const toId = $('#settleTo').value;
  const amount = parseFloat($('#settleAmount').value);
  const note = $('#settleNote').value.trim();
  const err = $('#settleErr');
  if (!amount || amount <= 0) { err.textContent = 'Enter a valid amount.'; return; }
  if (fromId === toId) { err.textContent = 'From and to must differ.'; return; }
  $('#settleSubmit').disabled = true;
  try {
    const r = await apiPost({ action: 'append', code: partyCode, event: { type: 'settle', data: { fromId, toId, amount, note } } });
    if (r.error) throw new Error(r.error);
    $('#settleOverlay').classList.remove('open');
    await refresh();
  } catch (e) { err.textContent = 'Failed: ' + e.message; }
  $('#settleSubmit').disabled = false;
};

$('#leaveBtn').onclick = async () => {
  const name = (members[myId] && members[myId].name) || '';
  try { await apiPost({ action: 'append', code: partyCode, event: { type: 'leave', data: { id: myId, name } } }); } catch (e) { /* best effort */ }
  removeParty(partyCode);
  const next = getActiveParty();
  if (next) { await switchToParty(next.code); } else { partyCode = null; myId = null; showGate(); }
};

// ====== PARTY SWITCHER MENU ======
function renderPartyMenu() {
  const menu = $('#partyMenu');
  menu.innerHTML = '';
  for (const p of loadPartyList()) {
    const item = el('button', 'party-menu-item' + (p.code === partyCode ? ' active' : ''), p.code);
    item.onclick = () => { menu.hidden = true; if (p.code !== partyCode) switchToParty(p.code); };
    menu.appendChild(item);
  }
  const addItem = el('button', 'party-menu-item add', '+ Join or create another');
  addItem.onclick = () => { menu.hidden = true; showGate(); };
  menu.appendChild(addItem);
}
$('#switchBtn').onclick = (e) => {
  e.stopPropagation();
  const menu = $('#partyMenu');
  if (menu.hidden) { renderPartyMenu(); menu.hidden = false; } else menu.hidden = true;
};
document.addEventListener('click', (e) => {
  const menu = $('#partyMenu');
  if (!menu.hidden && !menu.contains(e.target) && e.target !== $('#switchBtn')) menu.hidden = true;
});

// ====== COPY CODE / SHARE LINK ======
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      return true;
    } catch (e2) { return false; }
  }
}
function flashButton(btn, text) {
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = orig; }, 1200);
}
$('#partyNameBtn').onclick = async () => {
  const btn = $('#partyNameBtn');
  if (await copyText(partyCode)) flashButton(btn, 'copied!');
};
$('#shareBtn').onclick = async () => {
  const url = location.origin + location.pathname + '?code=' + partyCode;
  if (navigator.share) {
    try { await navigator.share({ title: 'SplitSmart', text: `Join our SplitSmart ledger: ${partyCode}`, url }); } catch (e) { /* user cancelled */ }
  } else if (await copyText(url)) {
    flashButton($('#shareBtn'), '✓');
  }
};

// ====== INIT ======
(async function init() {
  if (API_URL.includes('PASTE_YOUR')) {
    $('#gateErr').textContent = 'Set API_URL in app.js first (see apps-script.gs).';
  }
  const urlCode = new URLSearchParams(location.search).get('code');
  const cleanUrlCode = urlCode ? urlCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : null;

  if (cleanUrlCode) {
    const existing = loadPartyList().find(p => p.code === cleanUrlCode);
    if (existing) {
      history.replaceState(null, '', location.pathname);
      try { await switchToParty(existing.code); } catch (e) { removeParty(existing.code); location.reload(); }
      return;
    }
  }

  const active = !cleanUrlCode && getActiveParty();
  if (active) {
    partyCode = active.code;
    myId = active.id;
    try { await enterParty(); } catch (e) { removeParty(partyCode); location.reload(); }
    return;
  }

  if (cleanUrlCode) { setGateTab('join'); $('#codeInput').value = cleanUrlCode; } // share link -> land on join tab, prefilled
})();
