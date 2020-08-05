import refetch from './refetch';
import { TIMEOUT_ERROR } from './support/error';

Object.defineProperties(
  refetch,
  ['delay', 'init', 'limit', 'many', 'one', 'retry', 'timeout'].reduce(
    function (descriptors, property) {
      descriptors[property] = {
        get() {
          return refetch()[property];
        }
      };

      return descriptors;
    },
    {}
  )
);

Object.defineProperties(refetch, {
  retryAfterTimeout: {
    value: function (responseOrError) {
      return responseOrError === TIMEOUT_ERROR;
    }
  }
});

export default refetch;
