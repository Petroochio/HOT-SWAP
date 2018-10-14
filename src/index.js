import { pipe, map, split } from 'ramda';
import xs from 'xstream';

import SerialProducer from './SerialProducer';
import { init } from './GameManager';

const serial = new SerialProducer();

// HEY PETER SEPARATE EACH INPUT WITH A - IN THE THING
const input$ = xs.create(serial)
  .map(d => d.toString())
  .map(split(':'))
  .map(map(pipe(split(' '), map(parseInt))));

window.onload = init(input$);
