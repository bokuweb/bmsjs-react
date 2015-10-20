import _ from 'lodash'

export default class BufferLoader {
  constructor(context, urls, prefix) {
    this.context = context;
    this.urls = urls;
    this.prefix = prefix;
    this.buffers = [];
  }

  load() {
    return new Promise((resolve, reject) => {
      Promise.all(_.map(this.urls, this.loadBuffer.bind(this))).then(() => {
        resolve(this.buffers);
      });
    });
  }

  loadBuffer(url, id) {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open("GET", this.prefix + encodeURIComponent(url), true);
      request.responseType = "arraybuffer";

      request.onload = () => {
        this.context.decodeAudioData(request.response, (buffer) => {
          if (!buffer) reject();
          this.buffers[id] = buffer;
          resolve();
        });
      }
      request.onerror = () => console.log('BufferLoader: XHR error');
      request.send();
    });
  }
}
