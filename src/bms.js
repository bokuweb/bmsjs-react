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

const  bindOnce = (() => {
  var cache = {}
  return view => {
    if (!cache[view.toString()]) {
      cache[view.toString()] = true
      console.log('cache static module');
      return view()
    }
    else {
      console.log('reuse static module');
      return {subtree: "retain"}
    }
  }
}());

class BmsModel {
  constructor(score, config) {
    this.score = score;
    this.config = config;
    this.timer = new Timer();
    this.audio = new Audio();
    this.bgm = new Bgm(this.score.bgms, this.audio.playSound.bind(this.audio));
    this.bpm = new Bpm(this.score.bpms);
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
            this.audio.playSound(note.wav, 0);
            return;
          } else {
            //return;
          }
        }
      }
    }
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
    setTimeout(() => {
      this.timer.start()
    }, stopTime);
    this.stopIndex++;
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
    this.activeNotes().map((note) => {
      const timings = note.bpm.timing;
      let index = note.index;
      while (time > timings[index]) {
        if (index < timings.length - 1) index+=1;
        else break;
      }
      const diffTime = timings[index] - time;
      const diffDist = diffTime * note.speed[index];
      let y = note.distY[index] - diffDist;
      // FIXME : define baseline coordinate to param or style
      if (y > 500) y = 500;
      // FIXME : define active time to param
      if (timings[index] + 200 < time) note.disabled = true;
      note.y = y;
      note.style = {
        top : `${y}px`,
        left : `${30 * note.key + 300}px`
      };
    });
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
    function createKeyElement() {
      let elements = [];
      // FIXME : should configuable key number
      for (var i = 0; i < 7; i+=1)
        elements.push(m(`.key.key-id${i}`, {key: i}));
      elements.push(m(`.key-turntable.key-id${i}`, {key: i}));
      return elements;
    }

    function getNotes(notes) {
      return  notes.map((note) => {
        if (note.y > 0) {
          return m("div.note", {
            style : note.style,
            class : note.className
          });
        }
      });
    }

    return m("#bms", [
      getNotes(this.vm.model.activeNotes()),
      m("span#bpm", this.vm.model.currentBPM()),
      //bindOnce(() => m("#decision-line")),
      m("#decision-line"),
      m("#keys", createKeyElement())
    ]);
  }
}
