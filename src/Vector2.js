// Vector format [x, y, z]
export function copy(v) {
  return [...v];
}

export function add(a, b) {
  return [
    a[0] + b[0],
    a[1] + b[1],
  ];
}

// Subtracts b from a
export function sub(a, b) {
  return [
    a[0] - b[0],
    a[1] - b[1],
  ];
}

export function cross(a, b) {
  return [
    (a[1] * b[0]) - (a[0] * b[1]),
    (a[0] * b[1]) - (a[1] * b[0]),
  ];
}

export function magnitude(vec) {
  return Math.sqrt((vec[0] * vec[0]) + (vec[1] * vec[1]));
}

export function scale(s, vec) {
  return [
    vec[0] * s,
    vec[1] * s,
  ];
}

function distance(a, b) {
  // not made yet
  return [0, 0];
}

export function rotate(angle, vec) {
  return [
    Math.cos(angle) * vec[0] - Math.sin(angle) * vec[1],
    Math.sin(angle) * vec[0] + Math.cos(angle) * vec[1],
  ];
}

export function normalize(vec) {
  return scale(1 / magnitude(vec), vec);
}
