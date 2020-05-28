import { DEFAULT_DELAY, DEFAULT_MAX_RETRIES } from './support/constants';
import { constant, getNumber, exposeAsProperties } from './support/helpers';

// Delay sequence function that always returns the value stored in the
// `DEFAULT_DELAY` constant.
const __default__ = constant(DEFAULT_DELAY);

// Delay sequence function that always returns `0`.
const __immediately__ = constant(0);

// Delay sequence function that takes a retry count argument and returns a
// value computed based on the Fibonacci sequence. The returned value is maxes
// out at 1000.
const __fibonacci__ = function (retry) {
  retry = Math.min(retry, DEFAULT_MAX_RETRIES) || 0;
  return Math.min(fibonacci(retry) * retry, 1000);
};

// Delay sequence function that takes a retry count argument and returns step
// values computed based on powers of 2, for every four consecutive retry count.
// The returned value is maxes out at 500.
const __progressive__ = function (retry) {
  retry = Math.min(retry, DEFAULT_MAX_RETRIES) || 0;
  return Math.min(Math.pow(2, retry >> 2), 5) * 100;
};

// Helper function that takes a function as its first argument and an optional
// number of retries as its second argument. It augments the function with a
// `retries` data property and sets its value to the resolved retries number.
// The `DEFAULT_MAX_RETRIES` constant value is used if the number of retries
// passed to this function fails to resolve to an integer.
const __withRetries__ = (fn, retries) => {
  return exposeAsProperties(fn, {
    retries: getNumber(retries, DEFAULT_MAX_RETRIES)
  });
};

// Creates a `Retry` object with the predefined delay sequence functions
// assigned to corresponding properties. Each delay sequence function is
// already augmented with retries.
const Retry = exposeAsProperties(Object.create(null), {
  default: __withRetries__(__default__),
  fibonacci: __withRetries__(__fibonacci__),
  immediately: __withRetries__(__immediately__),
  progressive: __withRetries__(__progressive__)
});

// Helper function for recursively generating Fibonacci sequence numbers with
// memoization (cached results).
function fibonacci(n) {
  const cache = [];

  return (fibonacci = function fib(n) {
    if (n > 0 && cache[n]) return cache[n];
    if (n <= 0) return (cache[n] = 0);
    if (n <= 2) return (cache[n] = 1);
    return (cache[n] = fib(n - 1) + fib(n - 2));
  })(n);
}

export default Retry;
