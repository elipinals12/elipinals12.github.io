/* ===== STATE ===== */
let counters = [{ id: uid(), name: 'Counter', value: 0, color: '#6366f1' }];
let activeId = null;
let currentPage = 'overview';
let modalHue = 250, modalSat = 80, modalLight = 60;
let colorPopEl = null, popTargetId = null;
let popHue = 0, popSat = 80, popLight = 55;

/* ===== UTILS ===== */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function find(id) {
  return counters.find(c => c.id === id);
}

function hsl2hex(h, s, l) {
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toH = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + toH(r) + toH(g) + toH(b);
}

function colorFlash(container, selector, color) {
  const sp = container.querySelector(selector);
  if (!sp) return;
  sp.style.background = `radial-gradient(circle, ${color}25 0%, transparent 70%)`;
  container.classList.remove('flash');
  void container.offsetWidth;
  container.classList.add('flash');
  setTimeout(() => container.classList.remove('flash'), 60);
}

/* ===== 2D COLOR PICKER ===== */
function drawPickerCanvas(canvas, lightness) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = hsl2hex((x / w) * 360, 100 - (y / h) * 100, lightness);
      const i = (y * w + x) * 4;
      img.data[i] = parseInt(hex.slice(1, 3), 16);
      img.data[i + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[i + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function setupPicker(wrapEl, canvas, thumb, getLight, onPick) {
  let down = false;
  function pick(ex, ey) {
    const r = wrapEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (ex - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (ey - r.top) / r.height));
    thumb.style.left = (x * 100) + '%';
    thumb.style.top = (y * 100) + '%';
    const hex = hsl2hex(x * 360, 100 - y * 100, getLight());
    thumb.style.background = hex;
    onPick(x * 360, 100 - y * 100, hex);
  }
  wrapEl.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    down = true; wrapEl.setPointerCapture(e.pointerId);
    pick(e.clientX, e.clientY);
  });
  wrapEl.addEventListener('pointermove', e => {
    if (down) { e.stopPropagation(); pick(e.clientX, e.clientY); }
  });
  wrapEl.addEventListener('pointerup', () => down = false);
  wrapEl.addEventListener('pointercancel', () => down = false);
  return { redraw: () => drawPickerCanvas(canvas, getLight()) };
}

/* ===== MODAL PICKER ===== */
let modalPicker = null;
function initModalPicker() {
  const wrap = document.getElementById('modalPicker');
  const canvas = wrap.querySelector('canvas');
  const thumb = wrap.querySelector('.thumb');
  const slider = document.getElementById('modalLightness');
  const swatch = document.getElementById('modalSwatch');
  const hexEl = document.getElementById('modalHex');
  const btn = document.getElementById('createBtn');

  function getLight() { return +slider.value; }
  function updatePreview(hex) {
    swatch.style.background = hex;
    hexEl.value = hex;
    btn.style.background = hex;
    slider.style.background = `linear-gradient(to right, ${hsl2hex(modalHue, modalSat, 30)}, ${hsl2hex(modalHue, modalSat, 75)})`;
  }

  modalPicker = setupPicker(wrap, canvas, thumb, getLight, (h, s, hex) => {
    modalHue = h; modalSat = s; updatePreview(hex);
  });

  slider.oninput = () => {
    modalLight = +slider.value;
    modalPicker.redraw();
    const hex = hsl2hex(modalHue, modalSat, modalLight);
    thumb.style.background = hex;
    updatePreview(hex);
  };

  hexEl.addEventListener('blur', () => {
    let v = hexEl.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (isValidHex(v)) {
      const hsl = hex2hsl(v);
      modalHue = hsl.h; modalSat = hsl.s; modalLight = Math.max(30, Math.min(75, hsl.l));
      slider.value = Math.round(modalLight);
      modalPicker.redraw();
      thumb.style.left = (modalHue / 360 * 100) + '%';
      thumb.style.top = ((100 - modalSat) / 100 * 100) + '%';
      thumb.style.background = v;
      updatePreview(v);
    }
  });
  hexEl.addEventListener('keydown', ev => { if (ev.key === 'Enter') hexEl.blur(); });

  modalPicker.redraw();
  thumb.style.left = (modalHue / 360 * 100) + '%';
  thumb.style.top = ((100 - modalSat) / 100 * 100) + '%';
  const initHex = hsl2hex(modalHue, modalSat, modalLight);
  thumb.style.background = initHex;
  updatePreview(initHex);
}

/* ===== PAGE SWITCHING ===== */
function switchPage(p) {
  currentPage = p;
  document.querySelectorAll('.topbar button[data-page]').forEach(b =>
    b.classList.toggle('active', b.dataset.page === p)
  );
  render();
}

function render() {
  closeColorPop();
  const el = document.getElementById('pageContent');
  if (currentPage === 'overview') renderOverview(el);
  else if (currentPage === 'chart') renderChart(el);
  else if (currentPage === 'ranking') renderRanking(el);
  else if (currentPage === 'manage') renderManage(el);
}

/* ===== OVERVIEW ===== */
function renderOverview(el) {
  if (!counters.length) { el.innerHTML = '<div class="empty-msg">No counters yet</div>'; return; }
  let h = `<div class="grid" data-count="${Math.min(counters.length, 3)}">`;
  counters.forEach(c => {
    h += `<div class="card" style="border-color:${c.color}22" data-id="${c.id}">
      <div class="sparkle"></div>
      <input class="name-edit" style="color:${c.color}" value="${esc(c.name)}" maxlength="24">
      <div class="count" style="color:${c.color}">${c.value}</div>
      <div class="btns">
        <button style="background:${c.color}30;color:${c.color}" data-id="${c.id}" data-d="-1">−</button>
        <button style="background:${c.color}50;color:${c.color}" data-id="${c.id}" data-d="1">+</button>
      </div>
    </div>`;
  });
  h += '</div>';
  el.innerHTML = h;

  // Wire events after DOM is built
  el.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    const nameInput = card.querySelector('.name-edit');

    // Stop name input clicks from opening detail
    nameInput.addEventListener('click', e => e.stopPropagation());
    nameInput.addEventListener('focus', e => e.stopPropagation());
    nameInput.addEventListener('blur', () => {
      const c = find(id);
      if (c) c.name = nameInput.value.trim() || 'Counter';
    });

    // +/- buttons
    card.querySelectorAll('.btns button').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const ct = find(btn.dataset.id);
        const d = +btn.dataset.d;
        if (ct) {
          ct.value += d;
          colorFlash(card, '.sparkle', ct.color);
          card.querySelector('.count').textContent = ct.value;
        }
      });
    });

    // Clicking card body opens detail
    card.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      openDetail(id);
    });
  });
}

/* ===== DETAIL ===== */
function openDetail(id) {
  activeId = id;
  renderDetail();
  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail() {
  activeId = null;
  document.getElementById('detailOverlay').classList.remove('open');
  render();
}

function renderDetail() {
  const c = find(activeId);
  if (!c) return closeDetail();
  const dn = document.getElementById('detailName');
  dn.value = c.name; dn.style.color = c.color;
  const dc = document.getElementById('detailCount');
  dc.value = c.value; dc.style.color = c.color;
  const card = document.getElementById('detailCard');
  card.style.borderTop = `3px solid ${c.color}`;
  card.querySelectorAll('.pos').forEach(b => b.style.background = c.color + '40');
  card.querySelectorAll('.neg').forEach(b => b.style.background = c.color + '20');
}

function renameDetail(val) {
  const c = find(activeId);
  if (c) c.name = val.trim() || 'Counter';
}

function setDetailVal(val) {
  const c = find(activeId);
  if (c) {
    const n = parseInt(val);
    c.value = isNaN(n) ? 0 : n;
    renderDetail();
  }
}

function adjFlash(d) {
  const c = find(activeId);
  if (!c) return;
  c.value += d;
  renderDetail();
  const card = document.getElementById('detailCard');
  const splash = document.getElementById('detailSplash');
  splash.style.background = `radial-gradient(circle, ${c.color}20 0%, transparent 70%)`;
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
  setTimeout(() => card.classList.remove('flash'), 60);
}

function resetCurrent() {
  const c = find(activeId);
  if (c) { c.value = 0; renderDetail(); }
}

function deleteCurrent() {
  counters = counters.filter(c => c.id !== activeId);
  closeDetail();
}

/* ===== PIE CHART ===== */
function renderChart(el) {
  const valid = counters.filter(c => c.value > 0);
  if (!valid.length) {
    el.innerHTML = '<div class="chart-page"><div class="chart-empty">Need at least one counter above 0</div></div>';
    return;
  }
  const total = valid.reduce((s, c) => s + c.value, 0);
  let cum = 0;
  const slices = valid.map(c => {
    const start = cum / total * 360;
    const sweep = c.value / total * 360;
    cum += c.value;
    return { ...c, start, sweep };
  });
  let svg = '<svg viewBox="-1.1 -1.1 2.2 2.2" xmlns="http://www.w3.org/2000/svg">';
  if (slices.length === 1) {
    svg += `<circle cx="0" cy="0" r="1" fill="${slices[0].color}"/>`;
  } else {
    slices.forEach(s => {
      const lg = s.sweep > 180 ? 1 : 0;
      const sr = s.start * Math.PI / 180 - Math.PI / 2;
      const er = (s.start + s.sweep) * Math.PI / 180 - Math.PI / 2;
      svg += `<path d="M0 0 L${Math.cos(sr)} ${Math.sin(sr)} A1 1 0 ${lg} 1 ${Math.cos(er)} ${Math.sin(er)}Z" fill="${s.color}"/>`;
    });
  }
  svg += '</svg>';
  let legend = '<div class="chart-legend">';
  valid.forEach(c => {
    const pct = Math.round(c.value / total * 100);
    legend += `<div class="item"><div class="dot" style="background:${c.color}"></div>${esc(c.name)} · ${c.value} (${pct}%)</div>`;
  });
  legend += '</div>';
  el.innerHTML = `<div class="chart-page"><div class="chart-wrap">${svg}</div>${legend}</div>`;
}

/* ===== RANKING ===== */
function renderRanking(el) {
  if (!counters.length) { el.innerHTML = '<div class="empty-msg">No counters</div>'; return; }
  const sorted = [...counters].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map(c => Math.abs(c.value)), 1);
  let h = '<div class="ranking-page">';
  sorted.forEach((c, i) => {
    const w = Math.max((Math.abs(c.value) / max) * 100, 2);
    h += `<div class="rank-item">
      <div class="rank-pos">${i + 1}</div>
      <div class="rank-bar-wrap">
        <div class="rank-name" style="color:${c.color}">${esc(c.name)}</div>
        <div class="rank-bar" style="background:${c.color};width:${w}%"></div>
      </div>
      <div class="rank-val" style="color:${c.color}">${c.value}</div>
    </div>`;
  });
  h += '</div>';
  el.innerHTML = h;
}

/* ===== MANAGE ===== */
function renderManage(el) {
  if (!counters.length) { el.innerHTML = '<div class="empty-msg">No counters</div>'; return; }
  let h = '<div class="manage-page" id="manageList">';
  counters.forEach((c, i) => {
    h += `<div class="manage-item" data-id="${c.id}" data-idx="${i}">
      <div class="manage-grip" data-idx="${i}">⠿</div>
      <div class="manage-swatch" style="background:${c.color}" data-id="${c.id}"></div>
      <input class="manage-name" value="${esc(c.name)}" maxlength="24" data-id="${c.id}">
      <input class="manage-val" value="${c.value}" data-id="${c.id}" style="color:${c.color}">
      <button class="manage-del" data-id="${c.id}">×</button>
    </div>`;
  });
  h += '</div>';
  el.innerHTML = h;

  // Wire manage events
  el.querySelectorAll('.manage-name').forEach(input => {
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('blur', () => {
      const c = find(input.dataset.id);
      if (c) c.name = input.value.trim() || 'Counter';
    });
  });

  el.querySelectorAll('.manage-val').forEach(input => {
    input.addEventListener('click', e => { e.stopPropagation(); input.select(); });
    input.addEventListener('blur', () => {
      const c = find(input.dataset.id);
      if (c) {
        const n = parseInt(input.value);
        c.value = isNaN(n) ? 0 : n;
        input.value = c.value;
      }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur();
    });
  });

  el.querySelectorAll('.manage-swatch').forEach(swatch => {
    swatch.addEventListener('click', e => {
      e.stopPropagation();
      openColorPop(e, swatch.dataset.id);
    });
  });

  el.querySelectorAll('.manage-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      counters = counters.filter(c => c.id !== btn.dataset.id);
      render();
    });
  });

  initManageDrag();
}

/* ===== MANAGE DRAG REORDER ===== */
function initManageDrag() {
  const list = document.getElementById('manageList');
  if (!list) return;

  list.querySelectorAll('.manage-grip').forEach(grip => {
    grip.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      const dragIdx = +grip.dataset.idx;
      const item = grip.closest('.manage-item');
      item.classList.add('dragging');
      grip.setPointerCapture(e.pointerId);

      const getItems = () => list.querySelectorAll('.manage-item');

      const onMove = ev => {
        ev.stopPropagation();
        const items = getItems();
        items.forEach(el => el.classList.remove('drag-over-top', 'drag-over-bot'));
        const y = ev.clientY;
        let closest = null, closestDist = Infinity, pos = 'bot';
        items.forEach((el, i) => {
          if (i === dragIdx) return;
          const r = el.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          const dist = Math.abs(y - mid);
          if (dist < closestDist) {
            closestDist = dist;
            closest = el;
            pos = y < mid ? 'top' : 'bot';
          }
        });
        if (closest) closest.classList.add(pos === 'top' ? 'drag-over-top' : 'drag-over-bot');
      };

      const onUp = ev => {
        grip.removeEventListener('pointermove', onMove);
        grip.removeEventListener('pointerup', onUp);
        grip.removeEventListener('pointercancel', onUp);
        const items = getItems();
        let targetIdx = dragIdx;
        items.forEach((el, i) => {
          if (el.classList.contains('drag-over-top')) targetIdx = i <= dragIdx ? i : i;
          if (el.classList.contains('drag-over-bot')) targetIdx = i < dragIdx ? i + 1 : i;
        });
        if (targetIdx !== dragIdx) {
          const moved = counters.splice(dragIdx, 1)[0];
          counters.splice(targetIdx, 0, moved);
        }
        render();
      };

      grip.addEventListener('pointermove', onMove);
      grip.addEventListener('pointerup', onUp);
      grip.addEventListener('pointercancel', onUp);
    });
  });
}

/* ===== HEX PARSING ===== */
function hex2hsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r = parseInt(hex.slice(0,2),16)/255;
  const g = parseInt(hex.slice(2,4),16)/255;
  const b = parseInt(hex.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = ((g-b)/d + (g<b?6:0))*60;
    else if (max === g) h = ((b-r)/d + 2)*60;
    else h = ((r-g)/d + 4)*60;
  }
  return { h, s: s*100, l: l*100 };
}

function isValidHex(v) {
  return /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v);
}

/* ===== MANAGE COLOR POP ===== */
function openColorPop(e, id) {
  e.stopPropagation();
  closeColorPop();
  popTargetId = id;

  const ct = find(id);
  const startHSL = ct ? hex2hsl(ct.color) : { h: 0, s: 80, l: 55 };
  popHue = startHSL.h; popSat = startHSL.s; popLight = Math.max(30, Math.min(75, startHSL.l));

  const rect = e.target.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'color-pop';
  pop.style.top = Math.min(rect.bottom + 6, window.innerHeight - 260) + 'px';
  pop.style.left = Math.min(rect.left, window.innerWidth - 230) + 'px';
  pop.innerHTML = `
    <div class="cp-canvas-wrap"><canvas></canvas><div class="thumb"></div></div>
    <input type="range" class="cp-light" min="30" max="75" value="${Math.round(popLight)}">
    <div class="cp-preview">
      <div class="cp-swatch"></div>
      <input class="cp-hex" maxlength="7" value="${ct ? ct.color : '#000000'}">
    </div>`;
  pop.addEventListener('click', ev => ev.stopPropagation());
  document.body.appendChild(pop);
  colorPopEl = pop;

  const wrap = pop.querySelector('.cp-canvas-wrap');
  const canvas = pop.querySelector('canvas');
  const thumb = pop.querySelector('.thumb');
  const slider = pop.querySelector('.cp-light');
  const swatchEl = pop.querySelector('.cp-swatch');
  const hexInput = pop.querySelector('.cp-hex');

  function updatePopPreview(hex) {
    swatchEl.style.background = hex;
    hexInput.value = hex;
    slider.style.background = `linear-gradient(to right, ${hsl2hex(popHue, popSat, 30)}, ${hsl2hex(popHue, popSat, 75)})`;
    const ct = find(popTargetId);
    if (ct) { ct.color = hex; refreshManageColors(); }
  }

  const pp = setupPicker(wrap, canvas, thumb, () => +slider.value, (h, s, hex) => {
    popHue = h; popSat = s;
    updatePopPreview(hex);
  });

  slider.addEventListener('input', () => {
    popLight = +slider.value;
    pp.redraw();
    const hex = hsl2hex(popHue, popSat, popLight);
    thumb.style.background = hex;
    updatePopPreview(hex);
  });

  hexInput.addEventListener('click', ev => ev.stopPropagation());
  hexInput.addEventListener('blur', () => {
    let v = hexInput.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (isValidHex(v)) {
      const hsl = hex2hsl(v);
      popHue = hsl.h; popSat = hsl.s; popLight = Math.max(30, Math.min(75, hsl.l));
      slider.value = Math.round(popLight);
      pp.redraw();
      thumb.style.left = (popHue / 360 * 100) + '%';
      thumb.style.top = ((100 - popSat) / 100 * 100) + '%';
      thumb.style.background = v;
      updatePopPreview(v);
    }
  });
  hexInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') hexInput.blur(); });

  pp.redraw();
  // Position thumb at current color
  thumb.style.left = (popHue / 360 * 100) + '%';
  thumb.style.top = ((100 - popSat) / 100 * 100) + '%';
  slider.style.background = `linear-gradient(to right, ${hsl2hex(popHue, popSat, 30)}, ${hsl2hex(popHue, popSat, 75)})`;
  if (ct) {
    thumb.style.background = ct.color;
    swatchEl.style.background = ct.color;
  }
}

function refreshManageColors() {
  // Update swatches and value colors without full re-render (preserves focus)
  document.querySelectorAll('.manage-item').forEach(item => {
    const id = item.dataset.id;
    const c = find(id);
    if (!c) return;
    const swatch = item.querySelector('.manage-swatch');
    const val = item.querySelector('.manage-val');
    if (swatch) swatch.style.background = c.color;
    if (val) val.style.color = c.color;
  });
}

function closeColorPop() {
  if (colorPopEl) { colorPopEl.remove(); colorPopEl = null; popTargetId = null; }
}

document.addEventListener('click', closeColorPop);

/* ===== MODAL ===== */
function openModal() {
  modalHue = Math.random() * 360;
  modalSat = 70 + Math.random() * 30;
  modalLight = 60;
  document.getElementById('nameInput').value = '';
  document.getElementById('modalLightness').value = modalLight;
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => { initModalPicker(); document.getElementById('nameInput').focus(); }, 60);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function createCounter() {
  const name = document.getElementById('nameInput').value.trim() || 'Counter';
  const color = hsl2hex(modalHue, modalSat, modalLight);
  counters.push({ id: uid(), name, value: 0, color });
  closeModal();
  switchPage('overview');
}

/* ===== INIT ===== */
render();