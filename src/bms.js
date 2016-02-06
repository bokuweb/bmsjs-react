import React, { Component } from 'react';
import {Layer, Rect, Stage, Group} from 'react-konva';
import { render } from 'react-dom';
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

export default class Bms extends Component {
  constructor(props) {
    super(props);
    const {score, config} = props;
    this.state = {
      score,
      activeNotes : [],
      currentBPM : null
    };
    this.init(score, config).then(this.start.bind(this));
  }

  init(score, config) {
    return new Promise((resolve, reject) => {
      this.timer = new Timer();
      this.audio = new Audio();
      this.bgm = new Bgm(score.bgms, this.audio.playSound.bind(this.audio));
      this.bpm = new Bpm(score.bpms);
      this.preload(score).then(resolve);
      const keyEvents = this._createKeyDownEvents(config.key);
      configureKeyEvent([
          ...keyEvents,
        {key : 27, listener : this.onESCKeyDown.bind(this)}
      ]);
    });
  }

  preload(score) {
    return new Promise((resolve, reject) => {
      this.bar = 0;
      this.stopIndex = 0;
      this.audio.load(score.wav, '/bms/AVALON/').then(resolve);
    });
  }

  start() {
    this.timer.start();
    this._update();
  }

  judge(key) {
    const time = this.timer.get();
    for (let i = 0, len = this.sate.activeNotes.length; i < len; i+=1) {
      let note = this.sate.activeNotes[i];
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
    let notes = this.state.activeNotes;
    for (let i = 0; i < notes.length; i+=1 ) {
      if (!notes[i].hasPlayed) {
        const timings = notes[i].bpm.timing;
        const playTime = timings[timings.length - 1] + this.props.config.timingAdjustment;
        if (time > playTime) {
          play(notes[i].wav, 0);
          notes[i].hasPlayed = true;
        }
      }
    }
  }

  _stopSequenceIfNeeded(time) {
    const {score} = this.props;
    const timings = score.stopTiming;
    if (timings[this.stopIndex] === undefined) return;
    if (time < timings[this.stopIndex].timing) return;
    const stops = score.stops;
    const barTime = 240000 / this.currentBPM;
    const stopTime = stops[timings[this.stopIndex].id] / 192 * barTime;
    this.timer.pause();
    setTimeout(() => {
      this.timer.start()
    }, stopTime);
    this.stopIndex++;
  }

  _rejectDisableNotes() {
    this.setState({activeNotes : _.reject(this.state.activeNotes, note => note.disabled)});
  }

  _generateActiveNotes(time) {
    const {score} = this.state;
    if (time > score.genTime[this.bar]) {
      const notes = score.notes[this.bar];
      let newNotes = this.state.activeNotes;
      for (let i = 0, len = notes.length; i < len; i+=1) {
        newNotes.push(notes[i]);
      }
      this.bar += 1;
      this.setState({activeNotes:newNotes});
    }
  }

  _updateNotesState(time) {
    const activeNotes = this.state.activeNotes.map((note) => {
      const timings = note.bpm.timing;
      let index = note.index;
      while (time > timings[index]) {
        if (index < timings.length - 1) index++;
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
      note.x = 30 * note.key;
      //note.style = {
      //  transform: `translate3d(${30*note.key+300}px, ${y}px, 0)`,
      //  WebkitTransform: `translate3d(${30*note.key+300}px, ${y}px, 0)`
      //top : `${y}px`,
      //left : `${30 * note.key + 300}px`
      //};
      return note;
    });
    this.setState({activeNotes});
  }

  onKeyDown(key) {
    //console.log(key);
    this.judge(key);
  }

  onESCKeyDown() {
    console.log("ESC");
  }

  _update(updatedAt) {
    this.startTime = this.startTime || updatedAt;
    const time = updatedAt - this.startTime;
    //const time = this.timer.get();
    if (this.props.config.isAutoPlay) this._autoPlay(time);
    this.bgm.playIfNeeded(time);
    this.currentBPM = this.bpm.update(time);
    this._stopSequenceIfNeeded(time);
    this._generateActiveNotes(time);
    this._updateNotesState(time);
    this._rejectDisableNotes();
    //this._updateNotes(time);
    requestAnimationFrame(this._update.bind(this), FPS);
    //this.forceUpdate();
  }

  _createKeyDownEvents(keys) {
    let events = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      events.push({key, listener : this.onKeyDown.bind(this, i)});
    }
    return events;
  }

  createKeyElement() {
    let elements = [];
    // FIXME : should configuable key number
    for (var i = 0; i < 7; i++)
      elements.push(<div className={`key key-id${i}`} key={i} />);
    elements.push(<div className={`key-turntable key-id${i}`} key={i} />);
    return elements;
  }

  getNotes(notes) {
    return notes.map((note) => {
      if (note.y > 0)
        return (
          <Rect
             x={note.x} y={note.y-1} width={28} height={12}
             fill={'#000000'}
             />
        );
      else null;
    });
  }

  render() {
    return (
      <div id="bms">
        <div id="decision-line" />
        <Stage width={300} height={600}>
          <Layer>
            {this.getNotes(this.state.activeNotes)}
          </Layer>
        </Stage>
        <div id="keys">{this.createKeyElement()}</div>
        <span id="bpm">{this.state.currentBPM}</span>
      </div>
    );
  }
}
