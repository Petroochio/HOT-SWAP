import { find } from 'ramda';

// In the future this class may need to support
// sending messages to the controller
// bc vibrations and stuff
class SerialProducer {
  constructor() {
    // should we open the port here?
    this.port = {};
  }

  start(listener) {
    // Could we do this in the constructor?
    SerialPort.list()
      // find the good port
      // we should maybe mess with the config on our arduinos for this
      .then(find(p => p.productId === '801e'))
      // to do error handling controller not being there
      .then(portInfo => new SerialPort(portInfo.comName)
        .pipe(new DelimiterParser({ delimiter: '-' })))
      .then((port) => {
        // Save this so we can close it?
        this.port = port;
        port.on('data', d => listener.next(d));
      });
  }

  stop() {
    console.log(this.port);
    console.log('Implement Stop nerd');
  }
}

export default SerialProducer;
