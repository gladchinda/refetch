import Refetch from './refetch';
import * as Retry from './support/retry';
import { withProperties } from './support/utils';
import { ABORT_ERROR, TIMEOUT_ERROR } from './support/error';

import {
  FibonacciDelaySequence as FibonacciDelay,
  ProgressiveDelaySequence as ProgressiveDelay
} from './support/delay';

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

withProperties.call(
  Refetch,
  {
    ABORT_ERROR,
    TIMEOUT_ERROR,
    FibonacciDelay,
    ProgressiveDelay,
    RetryOnError: Retry.ErrorRetry,
    RetryOnNetworkError: Retry.NetworkErrorRetry,
    RetryOnTimeout: Retry.TimeoutRetry
  },
  false
);

// Object.defineProperty(window, 'Refetch', {
//   value: Refetch,
//   enumerable: true
// });

export default Refetch;
