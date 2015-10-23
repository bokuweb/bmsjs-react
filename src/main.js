import m from 'mithril'
import request from 'browser-request'
import Parser from './parser'
import Bms from './bms'

request('./bms/AVALON/01_avalon[light7].bme', (err, res) => {
  if(!err) {
    const config = {
      highSpeed : 1,
      timingAdjustment : -8,
      isAutoPlay : true,
      key : [90, 83, 88, 68, 67, 70, 86, 16]
    }
    const parser = new Parser(config);
    const bms_json = parser.parse(res.body);
    const bms = m.component(new Bms(), bms_json, config);
    m.mount(document.getElementById("main"), bms);
  } else {
    throw err;
  }
});
