import { find, isNil, not, nth, pipe, take, tail } from 'ramda';

export function getAnalogButton(input$) {
  return input$
    // this could perhaps be simpler,
    // or only return the input data as digestible
    .map(find(([id]) => id > 830 && id < 850))
    .filter(pipe(isNil, not))
    .map(nth(1));
}

export function getKnob(input$) {
  return input$
    .map(find(([id]) => id > 680 && id < 710))
    .filter(pipe(isNil, not))
    .map(pipe(tail, take(2)));
}
