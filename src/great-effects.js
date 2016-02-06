import React, { Component } from 'react';
import {Sprite} from 'react-konva';

const FPS = 1000 / 60;
const requestAnimationFrame = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.setTimeout;
window.requestAnimationFrame = requestAnimationFrame;

export default class GreatEffects extends Component {
  constructor(props) {
    super(props);
    //FIXME: test
    this.index = 0;
    this.imageObj = new Image();
    this.imageObj.onload = () => {
      this.setState({isLoaded:true});
    };
    this.imageObj.src = this.props.src;
  }

  update(updatedAt) {
    requestAnimationFrame(this.update.bind(this), FPS);
  }

  render() {
    const animations = {
      idle: [
        0, 0, 160, 160,
        160, 0, 160, 160,
        320, 0, 160, 160,
        480, 0, 160, 160,
        640, 0, 160, 160,
        800, 0, 160, 160,
        0, 160, 160, 160,
        160, 160, 160, 160,
        320, 160, 160, 160,
        480, 160, 160, 160,
        640, 160, 160, 160,
        800, 160, 160, 160,
        0, 320, 160, 160,
        160, 320, 160, 160,
        320, 320, 160, 160,
        480, 320, 160, 160,
        640, 320, 160, 160,
        800, 320, 160, 160
      ],
    };
    this.index++;
    if (this.index > 18) this.index = 0;

    return (
      <Sprite 
         x={50}
         y={50}
         image={this.imageObj}
         animation="idle"
         animations={animations}
         frameIndex={this.index}
         visible={true}
         scale={{x:0.8, y:0.8}}/>
    );
  }
}
