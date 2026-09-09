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

// ====== LOCAL STORAGE ======
function saveIdentity() {
  localStorage.setItem('splitsmart_party', partyCode);
  localStorage.setItem('splitsmart_myid_' + partyCode, myId);
}
function loadIdentity() {
  const code = localStorage.getItem('splitsmart_party');
  if (!code) return null;
  const id = localStorage.getItem('splitsmart_myid_' + code);
  if (!id) return null;
  return { code, id };
}
function clearIdentity() {
  if (partyCode) localStorage.removeItem('splitsmart_myid_' + partyCode);
  localStorage.removeItem('splitsmart_party');
}

// ====== GATE (join/create) ======
let gateMode = 'join';
$('#tabJoin').onclick = () => { gateMode = 'join'; $('#tabJoin').classList.add('active'); $('#tabCreate').classList.remove('active'); $('#codeField').hidden = false; $('#gateSubmit').textContent = 'Join party'; };
$('#tabCreate').onclick = () => { gateMode = 'create'; $('#tabCreate').classList.add('active'); $('#tabJoin').classList.remove('active'); $('#codeField').hidden = true; $('#gateSubmit').textContent = 'Create party'; };

$('#gateSubmit').onclick = async () => {
  const name = $('#nameInput').value.trim();
  const errBox = $('#gateErr');
  errBox.textContent = '';
  if (!name) { errBox.textContent = 'Enter your name.'; return; }
  const payment = Array.from(document.querySelectorAll('#paychecks input:checked')).map(c => c.value);

  $('#gateSubmit').disabled = true;
  try {
    let code;
    if (gateMode === 'create') {
      const r = await apiPost({ action: 'create' });
      if (r.error) throw new Error(r.error);
      code = r.code;
    } else {
      code = $('#codeInput').value.trim().toLowerCase().replace(/\s+/g, '-');
      if (!/^[a-z]+(-[a-z]+){3}$/.test(code)) { errBox.textContent = 'Enter the 4-word code, e.g. coral-marble-quiver-basin.'; $('#gateSubmit').disabled = false; return; }
      const r = await apiGet({ action: 'exists', code });
      if (!r.exists) { errBox.textContent = 'No party with that code.'; $('#gateSubmit').disabled = false; return; }
    }
    myId = uid();
    partyCode = code;
    const color = randomMemberColor();
    const r2 = await apiPost({ action: 'append', code: partyCode, event: { type: 'join', data: { id: myId, name, payment, color } } });
    if (r2.error) throw new Error(r2.error);
    saveIdentity();
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
  $('#partyCodePill').textContent = partyCode;
  await refresh();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refresh, 8000);
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
    card.appendChild(el('div', 'pay', members[id].payment && members[id].payment.length ? members[id].payment.join(' · ') : ''));
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
    const actorId = ev.type === 'join' ? ev.data.id : ev.type === 'payment' ? ev.data.payerId : ev.data.fromId;
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

function describeEvent(ev) {
  if (ev.type === 'join') return `<b>${escapeHtml(ev.data.name)}</b> joined the party`;
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

$('#leaveBtn').onclick = () => {
  clearIdentity();
  if (pollTimer) clearInterval(pollTimer);
  location.reload();
};

// ====== INIT ======
(async function init() {
  if (API_URL.includes('PASTE_YOUR')) {
    $('#gateErr').textContent = 'Set API_URL in app.js first (see apps-script.gs).';
  }
  const saved = loadIdentity();
  if (saved) {
    partyCode = saved.code;
    myId = saved.id;
    try { await enterParty(); } catch (e) { clearIdentity(); location.reload(); }
  }
})();
