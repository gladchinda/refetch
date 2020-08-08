import Refetch from './refetch';

Object.defineProperties(
  refetch,
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

export default Refetch;
