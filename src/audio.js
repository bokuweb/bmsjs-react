import BufferLoader from './buffer-loader'

export default class Audio {
  constructor() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.buffers = [];
    this.gainNode = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.gainNode.gain.value = 0.05;
    //this.compressor.threshold.value = 20;
    //this.compressor.knee.value = 40;
    //this.compressor.ratio.value = 0;
    //this.compressor.reduction.value = -20;
    //this.compressor.attack.value = 0;
    //this.compressor.release.value = 0.25;
  }

  load(urls, prefix) {
    return new Promise((resolve, reject) => {
      const bufferLoader = new BufferLoader(this.context, urls, prefix);
      bufferLoader.load().then((buffers) => {
        this.buffers = buffers;
        const source = this.context.createBufferSource();
        resolve();
      }, (error) => console.log(error));
    });
  }

  getCurrentTime() {
    ~~(this.context.currentTime * 1000)
  }

  clearTimer() {
    this.context.currentTime = 0;
  }

  suspendTimer() {
    this.context.suspend();
  }

  resumeTimer() {
    this.context.resume();
  }

  playSound(id, time) {
    if (this.buffers[id] === undefined) return;
    let source = this.context.createBufferSource();
    source.buffer = this.buffers[id];
    source.connect(this.gainNode);
    this.gainNode.connect(this.compressor);
    this.compressor.connect(this.context.destination);
    source.start(time / 1000);
  }
}
