import React from 'react';
import { render } from 'react-dom';

//import m from 'mithril'
import request from 'browser-request'
import Parser from './parser'
import Bms from './bms'

request('./bms/AVALON/03_avalon[Another].bme', (err, res) => {
  if(!err) {
    const config = {
      highSpeed : 1,
      timingAdjustment : -8,
      isAutoPlay : true,
      key : [90, 83, 88, 68, 67, 70, 86, 16]
    }
    const parser = new Parser(config);
    const bms_json = parser.parse(res.body);
    render(
      <Bms config={config} score={bms_json} />,
      document.getElementById("main")
    );

    //m.mount(document.getElementById("main"), bms);
  } else {
    throw err;
  }
});
