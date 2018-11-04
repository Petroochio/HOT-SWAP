import STLLoader from '../lib/STLLoader';

const loader = new STLLoader();

// def memoize this biznuz
export function getModel(path) {
  return new Promise((resolve) => {
    // add error handling when model don't exist
    loader.load(path, data => resolve(data));
  });
}

export default getModel;
