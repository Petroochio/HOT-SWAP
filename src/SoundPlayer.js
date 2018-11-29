const audioCtx = new AudioContext();

const audioBuffers = {};

function loadSound(key, src) {
  const request = new XMLHttpRequest();
  request.open('GET', src, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = () => {
    audioCtx.decodeAudioData(request.response, (buffer) => {
      audioBuffers[key] = buffer;
    });
  };
  request.send();
}

loadSound('CANNON', './Assets/Sound/cannon.mp3');
loadSound('ERROR', './Assets/Sound/error.wav');
loadSound('FLAME', './Assets/Sound/flame.wav');
loadSound('EXPLODE', './Assets/Sound/explode.wav');

// ERROR HANDLE IF THE FILE ISN"T LOADED

export function createLoopedSound(key) {
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffers[key];
  source.connect(audioCtx.destination);
  source.loop = true;
  const gainNode = audioCtx.createGain();
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  console.log(gainNode.gain);
  return { sound: source, GAIN: gainNode.gain };
}

export function playSound(key) {
  // How does the garbage collector feel about this?
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffers[key];
  source.connect(audioCtx.destination);
  source.start(0);
}

export default playSound;