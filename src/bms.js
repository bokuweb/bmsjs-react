import m from 'mithril';
import _ from 'lodash';
import fastdom from 'fastdom';
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
    this.dom = "";
    this.notes = [];
  }

  init() {
    return new Promise((resolve, reject) => {
      this.bar = 0;
      this.stopIndex = 0;
      this.mainElement = document.getElementById('main'),
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
    for (let i = 0; i < notes.length; i+=1 ) {
      if (!notes[i].hasPlayed) {
        const timings = notes[i].bpm.timing;
        const playTime = timings[timings.length - 1] + this.config.timingAdjustment;
        if (time > playTime) {
          play(notes[i].wav, 0);
          notes[i].hasPlayed = true;
        }
      }
    }
    /*
    this.activeNotes().map((note) => {
      if (!note.hasPlayed) {
        const timings = note.bpm.timing;
        const playTime = timings[timings.length - 1] + this.config.timingAdjustment;
        if (time > playTime) {
          play(note.wav, 0);
          note.hasPlayed = true;
        }
      }
    });
    */
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
    let dom = '';
    let fragment;
    if (time > this.score.genTime[this.bar]) {
      const notes = this.score.notes[this.bar];
      fragment = document.createDocumentFragment();
      for (let i = 0, len = notes.length; i < len; i+=1) {
        this.activeNotes().push(notes[i]);
        var e = document.createElement('div');
        e.className = 'note-white';
        e.id = notes[i].id;
        fragment.appendChild(e);
        this.notes[notes[i].id] = e;
        //dom += '<div id="'+notes[i].id+'" class="note-white"></div>';
      }

      /*
      this.score.notes[this.bar].map((notes) => {
        this.activeNotes().push(notes);
      });
      */
      this.bar += 1;
    }
    if (fragment) this.mainElement.appendChild(fragment);
    //this.notes = this.mainElement.querySelectorAll('.note-white');
  }

  _updateNotesState(time) {
    let dom;
    let notes = this.activeNotes();
    for (let i = 0; i < notes.length; i+=1 ) {
    //this.activeNotes().map((note) => {
      const timings = notes[i].bpm.timing;
      let index = notes[i].index;
      while (time > timings[index]) {
        if (index < timings.length - 1) index++;
        else break;
      }
      const diffTime = timings[index] - time;
      const diffDist = diffTime * notes[i].speed[index];
      let y = notes[i].distY[index] - diffDist;
      // FIXME : define baseline coordinate to param or style
      if (y > 500) y = 500;
      // FIXME : define active time to param
      if (timings[index] + 200 < time) notes[i].disabled = true;
      //note.style = {
      //  top : `${y}px`,
      //  left : `${30 * note.key + 300}px`
      //};
      //console.dir(this.notes);
      fastdom.write(() => {
        const e = this.notes[notes[i].id];
        e.style.top = `${y}px`;
        e.style.left = `${30 * notes[i].key + 300}px`;
      });
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
    //m.redraw();
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

  view (ctrl) {/*
    function createKeyElement() {
      let elements = [];
      // FIXME : should configuable key number
      for (var i = 0; i < 7; i++)
        elements.push(m(`.key.key-id${i}`));
      elements.push(m(`.key-turntable.key-id${i}`));
      return elements;
    }
    
    return m("#bms", [
      this.vm.model.activeNotes().map((note) => {
        return m("div.note", {
          style : note.style,
          class : note.className
        });
      }),
      m("#decision-line"),
      m("#keys", createKeyElement()),
      m("span#bpm", this.vm.model.currentBPM())
    ]);
    */
  }
}
