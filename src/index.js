import R from 'ramda';
import xs from 'xstream';

import SerialProducer from './SerialProducer';
import { init } from './GameManager';

// const serial = new SerialProducer();

// xs.create(serial)
//   .map(d => d.toString())
//   .subscribe({
//     next: x => console.log(x),
//     error: x => console.log(x),
//     complete: x => console.log(x),
//   });

window.onload = init();
