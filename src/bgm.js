export default class Bgm {
  constructor(bgms, play) {
    this.index = 0;
    this.bgms = bgms;
    this.play = play;
  }

  playIfNeeded(time) {
    const bgms = this.bgms;
    while (bgms[this.index] !== undefined && time > bgms[this.index].timing) {
      if (time - bgms[this.index].timing < 500) {
        this.play(bgms[this.index].id, 0);
      }
      this.index+=1;
    }
  }
}
