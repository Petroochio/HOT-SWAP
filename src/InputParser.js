import {
  __, add, append, divide, find, isNil, not, reduce, pipe, takeLast, zipWith
} from 'ramda';

const notNil = pipe(isNil, not);

// all of the ids are hardcoded, we should create a function check and look at
// a file elseware
// Input Data protocol : [CONTROLLER_ID, INPUT_ID, VAL, VAL, VAL]

function parseKnobData(input$) {
  const smoothSampleSize = 10;
  return input$
    // gather last values
    .fold(
      (acc, newData) => {
        const newSample = [newData[1], newData[2]];
        const sampleLen = acc.samples.length;
        const samples = sampleLen < 0 ? append(newSample, acc.samples)
          : append(newSample, takeLast(smoothSampleSize, acc.samples));
        return {
          id: newData[0],
          samples,
        };
      },
      { id: 0, samples: [] }
    )
    // smooth output
    .map(data => ({
      id: data.id,
      value: reduce(zipWith(add), [0, 0])(data.samples).map(divide(__, smoothSampleSize)),
    }))
    .map(data => ({
      id: data.id,
      value: Math.atan2(data.value[0], data.value[1]),
    }));
}

const sailCal = [511, 509];
export function getSailKnob(input$) {
  const sail$ = input$
    .map(find(data => data[1] > 320 && data[1] < 330))
    .filter(notNil)
    .map(data => [data[0], data[2] - sailCal[0], data[3] - sailCal[1]]);
  return parseKnobData(sail$);
}

const rudderCal = [514, 511];
export function getRudderKnob(input$) {
  const rudder$ = input$
    .map(find(data => data[1] > 177 && data[1] < 187))
    .filter(notNil)
    .map(data => [data[0], data[2] - rudderCal[0], data[3] - rudderCal[1]]);
  return parseKnobData(rudder$);
}

export function getHatch(input$) {
  return input$
    .map(find(data => data[1] > 508 && data[1] < 518))
    .filter(notNil)
    .map(data => ({ id: data[0], isOpen: data[2] > 450 }));
}

export function getWick(input$) {
  return input$
    .map(find(data => data[1] > 399 && data[1] < 409))
    .filter(notNil)
    .map(data => ({ id: data[0], isLit: data[2] > 575 }));
}
