import Refetch from './refetch';

Object.defineProperties(
  Refetch,
  ['delay', 'init', 'limit', 'many', 'one', 'retry', 'timeout'].reduce(
    function (descriptors, property) {
      descriptors[property] = {
        get() {
          return Refetch()[property];
        }
      };

      return descriptors;
    },
    {}
  )
);

// Object.defineProperty(window, 'Refetch', {
//   value: Refetch,
//   enumerable: true
// });

export default Refetch;
