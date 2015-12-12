import m from 'mithril';
import _ from 'lodash';
import Timer from './timer';
import Audio from './audio';
import Bgm from './bgm';
import {configureKeyEvent} from './key-manager';
import Bpm from './bpm-manager';

const FPS = 1000 / 60;
const requestAnimationFrame = window.requestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.setTimeout;
window.requestAnimationFrame = requestAnimationFrame;

const bindOnce = () => {
  let cache = {};
  return view => {
    if (!cache[view.toString()]) {
      cache[view.toString()] = true;
      return view();
    }
    else {
      return {subtree: "retain"};
    }
  }
}();

class BmsModel {
  constructor(score, config) {
    this.score = score;
    this.config = config;
    this.timer = new Timer();
    this.audio = new Audio();
    this.bgm = new Bgm(this.score.bgms, this.audio.playSound.bind(this.audio));
    this.bpm = new Bpm(this.score.bpms);
    this.judgement = m.prop('');
    this.activeNotes = m.prop([]);
    this.currentBPM = m.prop(this.bpm.get());
  }

  init() {
    return new Promise((resolve, reject) => {
      this.bar = 0;
      this.stopIndex = 0;
      this.audio.load(this.score.wav, '/bms/AVALON/').then(resolve);
    });
  }

  start() {
    this.timer.start();
  }

  update(updatedAt) {
    //this.startTime = this.startTime || updatedAt;
    //const time = updatedAt - this.startTime;
    const time = this.timer.get();
    if (this.config.isAutoPlay) this._autoPlay(time);
    this.bgm.playIfNeeded(time);
    this.currentBPM(this.bpm.update(time));
    this._stopSequenceIfNeeded(time);
    this._updateNotes(time);
  }

  judge(key) {
    const time = this.timer.get();
    for (let i = 0, len = this.activeNotes().length; i < len; i+=1) {
      let note = this.activeNotes()[i];
      if (note.key === key) {
        const diffTime = note.timing - time;
        if (!note.clear) {
          if ((-200 < diffTime && diffTime < 200)) {
            console.log("hit");
            note.clear = true;
            if (-30 < diffTime && diffTime < 30 ) this._setJudge('great');
            else if (-60 < diffTime && diffTime < 60 ) this._setJudge('good');
            else if (-100 < diffTime && diffTime < 100 ) this._setJudge('bad');
            else this._setJudge('poor');
            this.audio.playSound(note.wav, 0);
            return;
          } else {
            //return;
          }
        }
      }
    }
  }

  _setJudge(judge) {
    this.judgement(judge);
    setTimeout(() => this.judge(''), 1000);
  }

  _updateNotes (time) {
    this._generateActiveNotes(time);
    this._updateNotesState(time);
    this._rejectDisableNotes();
  }

  _autoPlay(time) {
    const play = this.audio.playSound.bind(this.audio);
    let notes = this.activeNotes();
    for (let i = 0; i < notes.length; i+=1) {
      if (!notes[i].hasPlayed) {
        const timings = notes[i].bpm.timing;
        const playTime = timings[timings.length - 1] + this.config.timingAdjustment;
        if (time > playTime) {
          this._setJudge("great");
          play(notes[i].wav, 0);
          notes[i].hasPlayed = true;
        }
      }
    }
  }

  _stopSequenceIfNeeded(time) {
    const timings = this.score.stopTiming;
    if (timings[this.stopIndex] === undefined) return;
    if (time < timings[this.stopIndex].timing) return;
    const stops = this.score.stops;
    const barTime = 240000 / this.currentBPM();
    const stopTime = stops[timings[this.stopIndex].id] / 192 * barTime;
    this.timer.pause();
    setTimeout(this.timer.start, stopTime);
    this.stopIndex+=1;
  }

  _rejectDisableNotes() {
    this.activeNotes(_.reject(this.activeNotes(), note => note.disabled));
  }

  _generateActiveNotes(time) {
    if (time > this.score.genTime[this.bar]) {
      const notes = this.score.notes[this.bar];
      for (let i = 0, len = notes.length; i < len; i+=1) {
        this.activeNotes().push(notes[i]);
      }
      this.bar += 1;
    }
  }

  _updateNotesState(time) {
    for (let i = 0; i < this.activeNotes().length; i+=1) {
      let note = this.activeNotes()[i];
      const timings = note.bpm.timing;
      while (time > timings[note.index]) {
        if (note.index < timings.length - 1) note.index+=1;
        else break;
      }
      const diffTime = timings[note.index] - time;
      const diffDist = diffTime * note.speed[note.index];
      let y = note.distY[note.index] - diffDist;
      // FIXME : define baseline coordinate to param or style
      if (y > 500) y = 500;
      // FIXME : define active time to param
      if (timings[note.index] + 200 < time) note.disabled = true;
      note.y = y;
      note.style = {
        transform: `translate3d(${30*note.key+300}px, ${y}px, 0)`,
        WebkitTransform: `translate3d(${30*note.key+300}px, ${y}px, 0)`
      };
    }
  }
}

class BmsViewModel {
  init(score, config) {
    return new Promise((resolve, reject) => {
      this.model = new BmsModel(score, config);
      this.model.init().then(resolve);
      const keyEvents = this._createKeyDownEvents(config.key);
      configureKeyEvent([
        ...keyEvents,
        {key : 27, listener : this.onESCKeyDown.bind(this)}
      ]);
    });
  }

  onKeyDown(key) {
    //console.log(key);
    this.model.judge(key);
  }

  onESCKeyDown() {
    console.log("ESC");
  }

  start() {
    this.update();
    this.model.start();
  }

  update(updatedAt) {
    this.model.update(updatedAt);
    m.redraw();
    requestAnimationFrame(this.update.bind(this), FPS);
  }

  _createKeyDownEvents(keys) {
    let events = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      events.push({key, listener : this.onKeyDown.bind(this, i)});
    }
    return events;
  }
}

export default class Bms {
  constructor() {
    this.vm = new BmsViewModel();
    return {
      controller: (score, config) => {
        this.vm.init(score, config)
          .then(() => this.vm.start());
      },
      view: this.view.bind(this)
    };
  }

  view (ctrl) {
    const {model: {activeNotes, currentBPM, judgement}} = this.vm;
    const createKeyElement = () => {
      let elements = [];
      // FIXME : should configuable key number
      for (var i = 0; i < 7; i+=1)
        elements.push(m(`.key.key-id${i}`, {key: i}));
      elements.push(m(`.key-turntable.key-id${i}`, {key: i}));
      return elements;
    }

    const getNotes = notes => {
      return activeNotes().map((note, i) => {
        if (note.y > 0) {
          return m("div.note", {
            style : note.style,
            class : note.className,
            key : i
          });
        }
      });
    }
    return m("#bms", [
      m("div", [getNotes()]),
      m("span#bpm", currentBPM()),
      m("span.judge", judgement()),
      bindOnce(() => m("#decision-line")),
      bindOnce(() => m("#keys", createKeyElement()))
    ]);
  }
}
