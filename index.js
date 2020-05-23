import Fetch from './src/fetch';
import Retry from './src/retry';
import { DEFAULT_TIMEOUT } from './src/support/constants';
import { exposeAsProperties } from './src/support/helpers';

function refetch(config) {
  return new Fetch(config);
}

// Expose Retry (function) properties as static properties on the refetch function
// Expose timeout static property as the DEFAULT_TIMEOUT on the refetch function
exposeAsProperties(refetch, {
  ...Retry,
  timeout: DEFAULT_TIMEOUT
}, false);

// Expose refetch on the global object
// exposeAsProperties(global, { refetch });
export default refetch;
