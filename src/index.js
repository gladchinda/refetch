import Fetch from './fetch';
import Retry from './retry';
import { DEFAULT_TIMEOUT } from './support/constants';
import { exposeAsProperties } from './support/helpers';

function refetch(config) {
  return new Fetch(config);
}

// Expose Retry (function) properties as static properties on the refetch function
// Expose timeout static property as the DEFAULT_TIMEOUT on the refetch function
exposeAsProperties(
  refetch,
  {
    ...Retry,
    timeout: DEFAULT_TIMEOUT
  },
  false
);

// Expose refetch on the global object
// exposeAsProperties(global, { refetch });
export default refetch;
