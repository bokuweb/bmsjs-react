export default class Bgm {
  constructor(bgms, play) {
    this.index = 0;
    this.bgms = bgms;
    this.play = play;
  }

  playIfNeeded(time) {
    const bgms = this.bgms;
    if (bgms[this.index] === undefined) return;
    while (time > bgms[this.index].timing) {
      if (time - bgms[this.index].timing < 500) {
        this.play(bgms[this.index].id, 0);
      }
      this.index++;
      if (bgms[this.index] === undefined) return;
    }
  }
}
