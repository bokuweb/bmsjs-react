export default class Timer {
  constructor() {
    this.startTime = 0;
    this.pauseTime = 0;
    this.isPause = false;
  }

  start() {
    this.isPause = false;
    this.startTime = new Date();
  }

  set(time_msec) {
    this.startTime = new Date();
    this.pauseTime = time_msec;
  }

  get () {
    if (this.isPause)
      return this.pauseTime;
    else if (this.startTime)
      return ((new Date() - this.startTime) + this.pauseTime);
    else return 0;
  }

  pause () {
    this.isPause = true;
    this.pauseTime = ((new Date() - this.startTime) + this.pauseTime);
  }

  stop () {
    this.startTime = 0;
    this.pauseTime = 0;
  }
}

