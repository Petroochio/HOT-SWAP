import * as THREE from 'three';
import { takeLast } from 'ramda';

import STLLoader from '../lib/STLLoader';

const stlLoader = new STLLoader();
console.log(THREE);
const objLoader = new THREE.ObjectLoader();

// def memoize this biznuz
export function getModel(path) {
  return new Promise((resolve) => {
    if (takeLast(3, path) === 'stl') {
      stlLoader.load(path, data => resolve(data));
    } else {
      objLoader.load(path, data => resolve(data));
    }
    // add error handling when model don't exist
  });
}

export default getModel;
