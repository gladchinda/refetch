import Fetch from './fetch';
import Retry from './retry';
import { DEFAULT_TIMEOUT } from './support/constants';
import { exposeAsProperties } from './support/helpers';

// Define refetch function as a wrapper for returning a new Fetch instance.
function refetch(config) {
  return new Fetch(config);
}

// Expose the delay sequence function properties of the Retry object as static
// properties on the `refetch` function. Also, expose the DEFAULT_TIMEOUT
// constant value as a static `timeout` property on the `refetch` function.
// Finally, ensure the properties are non-enumerable and non-configurable.
exposeAsProperties(
  refetch,
  {
    ...Retry,
    timeout: DEFAULT_TIMEOUT
  },
  false
);

export default refetch;
