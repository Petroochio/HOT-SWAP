import { pipe, map, split } from 'ramda';
import xs from 'xstream';

import SerialProducer from './SerialProducer';
import { init, resize } from './GameManager';

// create serial port and open connection
const serial = new SerialProducer();

const input$ = xs.create(serial)
  .map(d => d.toString())
  .map(split(':'))
  .map(map(pipe(split(' '), map(parseInt))));

window.onload = () => { init(input$); };
window.onresize = resize;
