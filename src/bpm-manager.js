export default class BpmManager {
  constructor(bpms) {
    this.index = 0;
    this.bpms = bpms;
    this.currentBPM = bpms[0].val;
  }

  get() {
    return this.currentBPM;
  }

  update(time) {
    const bpms = this.bpms;
    if (bpms[this.index] === undefined) return this.currentBPM;
    if (time < bpms[this.index].timing) return this.currentBPM;
    this.currentBPM = bpms[this.index].val;
    this.index++
    return this.currentBPM;
  }
}
