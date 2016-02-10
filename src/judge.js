import React, { Component } from 'react';
import {Text} from 'react-konva';

export default class judge extends Component {
  constructor(props) {
    super(props);
    this.state = {judge: ''};
  }

  show (judge) {
    if (this.judgeTimerId) clearTimeout(this.judgeTimerId);
    this.setState({judge});
    this.judgeTimerId = setTimeout(() => this.setState({judge: ''}), 1000);
  }

  render() {
    const {x, y, fontSize, fill} = this.props;
    return (
      <Text
         x={x}
         y={y}
         text={this.state.judge}
         fontSize={32}
         fill={fill}
         align={'center'} />
    );
  }
}
