// stt worker: whisper (onnx) via transformers.js, 100% in-browser. weights are fetched once from the hf hub, then cached by the browser.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';

const MODELS = {
  fast: { id: 'onnx-community/whisper-base',  dtype: 'q8', device: 'wasm',   label: 'Whisper base', mb: 80 },
  good: { id: 'onnx-community/whisper-small', dtype: 'q8', device: 'wasm',   label: 'Whisper small', mb: 252 },
  best: { id: 'onnx-community/whisper-large-v3-turbo', dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' }, device: 'webgpu', label: 'Whisper large-v3-turbo', mb: 1610 },
};
const SR = 16000;
const MAX_WIN = 28 * SR;        // whisper takes 30s max per pass
const SILENCE_RMS = 0.004;      // below this a chunk is treated as silence (avoids "thank you." hallucinations)

if (self.crossOriginIsolated) env.backends.onnx.wasm.numThreads = Math.min(self.navigator.hardwareConcurrency || 4, 8);
else env.backends.onnx.wasm.numThreads = 1;

let asr = null, loadedKey = null;
const post = m => self.postMessage(m);

async function load(key) {
  if (asr && loadedKey === key) return post({ type: 'ready', model: key, device: MODELS[key].device });
  asr = null; loadedKey = null;
  const cfg = MODELS[key];
  const files = {};
  let last = 0;
  const progress = p => {
    if (p.status === 'progress' && p.file) files[p.file] = { l: p.loaded, t: p.total };
    else if (p.status === 'done' && p.file && files[p.file]) files[p.file].l = files[p.file].t;
    let l = 0, t = 0;
    for (const f in files) { l += files[f].l; t += files[f].t; }
    if (!t) return;
    const pct = Math.max(last, Math.min(99, (l / Math.max(t, cfg.mb * 1e6)) * 100)); // total unknown until every file has started, so use the known size
    last = pct;
    post({ type: 'progress', pct, text: `Downloading ${cfg.label} · ${(l / 1e6).toFixed(0)}/${(t / 1e6).toFixed(0)} MB` });
  };
  post({ type: 'progress', pct: 1, text: `Loading ${cfg.label}…` });
  asr = await pipeline('automatic-speech-recognition', cfg.id, { dtype: cfg.dtype, device: cfg.device, progress_callback: progress });
  loadedKey = key;
  post({ type: 'ready', model: key, device: cfg.device });
}

// cut into <=28s windows, preferring the quietest 50ms near the end of each window so words aren't split
function split(a) {
  const out = [];
  let s = 0;
  while (s < a.length) {
    let e = Math.min(s + MAX_WIN, a.length);
    if (e < a.length) {
      const W = SR / 20, from = Math.max(s + SR * 5, e - SR * 5);
      let best = Infinity, at = e;
      for (let i = from; i + W <= e; i += W / 2) {
        let sum = 0;
        for (let j = i; j < i + W; j++) sum += a[j] * a[j];
        if (sum < best) { best = sum; at = i + (W >> 1); }
      }
      e = at;
    }
    out.push([s, e]);
    s = e;
  }
  return out;
}
const rms = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / (a.length || 1)); };

async function transcribe(id, audio, lang) {
  const parts = split(audio);
  const opts = { task: 'transcribe', return_timestamps: false };
  if (lang && lang !== 'auto') opts.language = lang;
  for (let i = 0; i < parts.length; i++) {
    const [s, e] = parts[i];
    const chunk = audio.subarray(s, e);
    let text = '';
    if (chunk.length > SR * 0.3 && rms(chunk) > SILENCE_RMS) {
      const r = await asr(chunk, opts);
      text = (Array.isArray(r) ? r.map(x => x.text).join(' ') : r.text).trim();
    }
    post({ type: 'partial', id, text, done: i + 1, total: parts.length });
  }
  post({ type: 'done', id });
}

let queue = Promise.resolve();
self.onmessage = e => {
  const m = e.data;
  queue = queue.then(async () => {
    try {
      if (m.type === 'load') await load(m.model);
      else if (m.type === 'transcribe') await transcribe(m.id, m.audio, m.lang);
    } catch (err) {
      console.error(err);
      post({ type: 'error', where: m.type, id: m.id, message: (err && err.message) || String(err) });
    }
  });
};
post({ type: 'boot' });
