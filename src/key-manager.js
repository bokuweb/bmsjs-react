import events from 'events'
const eventEmitter = new events.EventEmitter();

export function configureKeyEvent(keyConfigs) {
  for (let config of keyConfigs) {
    eventEmitter.on(`key-${config.key}`, config.listener);
  }

  document.addEventListener('keydown', (event) => {
    eventEmitter.emit(`key-${event.keyCode}`);
  });
}

