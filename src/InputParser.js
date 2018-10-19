import { find, isNil, not, nth, pipe, take, tail } from 'ramda';

const notNil = pipe(isNil, not);

export function getAnalogButton(input$) {
  return input$
    // this could perhaps be simpler,
    // or only return the input data as digestible
    .map(find(([id]) => id > 830 && id < 850))
    .filter(notNil)
    .map(nth(1));
  // arr => arr[1]
  // use fold if we want to smooth
}

export function getKnob(input$) {
  return input$
    .map(find(([id]) => id > 680 && id < 710))
    .filter(notNil)
    .map(pipe(tail, take(2)));
  // arr => ([arr[1], arr[2]])
  // use fold if we want to smooth
}

export function getDigitalButton(input$) {
  return input$
    .map(find(([id]) => id > 505 && id < 515))
    .filter(notNil)
    .map(nth(1))
    .map(val => val > 800);
}

export function getThumbstick(input$) {
  return input$
    .map(find(([id]) => id > 605 && id < 615))
    .filter(notNil)
    .map(pipe(tail, take(2)))
    // sensor vals reversed
    .map(([y, x]) => ([x, y]));
}

/*
x: 437, 125
y: 461, 492
*/
