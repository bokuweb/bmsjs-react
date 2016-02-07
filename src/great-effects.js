import React, { Component } from 'react';
import {Sprite, Layer, Group} from 'react-konva';

const FPS = 1000 / 60;
const requestAnimationFrame = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.setTimeout;
window.requestAnimationFrame = requestAnimationFrame;

export default class GreatEffects extends Component {
  constructor(props) {
    super(props);
    this.image = new Image();
    this.state = {effects:[]};
    this.image.onload = () => {};
    this.image.src = this.props.src;
    this.animations = {
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
  }

  componentDidMount() {
    this.update();
  }

  update(updatedAt) {
    const newEffects = this.state.effects
            .map(effect => ({key: effect.key, frame: effect.frame+1}))
            .filter(effect => effect.frame < 18);
    this.setState({effects: newEffects});
    requestAnimationFrame(this.update.bind(this), FPS);
  }

  play(key) {
    const newEffects = this.state.effects.concat([{key, frame: 0}]);
    this.setState({effects: newEffects});
  }

  render() {


    return (
      <Group>
        {
          this.state.effects.map(effect => {
            return (
              <Sprite
                 x={effect.key * 30 - 50}
                 y={this.props.y}
                 image={this.image}
                 animation="idle"
                 animations={this.animations}
                 frameIndex={effect.frame}
                 visible={true}
                 scale={{x:0.8, y:0.8}}/>
            );
          })
        }
      </Group>
    );
  }
}
