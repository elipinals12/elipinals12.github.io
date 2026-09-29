// mic capture: batches 4096 mono samples and posts them to the main thread
class Cap extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(4096); this.n = 0; }
  process(inputs) {
    const c = inputs[0] && inputs[0][0];
    if (!c) return true;
    for (let k = 0; k < c.length; k++) {
      this.b[this.n++] = c[k];
      if (this.n === 4096) { this.port.postMessage(this.b, [this.b.buffer]); this.b = new Float32Array(4096); this.n = 0; }
    }
    return true;
  }
}
registerProcessor('cap', Cap);
