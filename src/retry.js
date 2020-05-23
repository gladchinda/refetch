import { DEFAULT_DELAY, DEFAULT_MAX_RETRIES } from './support/constants';
import { constant, getNumber, exposeAsProperties } from './support/helpers';

const __default__ = constant(DEFAULT_DELAY);
const __immediately__ = constant(0);

const __fibonacci__ = function (retry) {
  return Math.min(fibonacci(retry) * retry, 1000);
};

const __progressive__ = function (retry) {
  return Math.min(Math.pow(2, retry >> 2), 5) * 100;
};

const __withRetries__ = (fn, retries) => {
  return exposeAsProperties(fn, {
    retries: getNumber(retries, DEFAULT_MAX_RETRIES)
  });
}

const Retry = exposeAsProperties(Object.create(null), {
  default: __withRetries__(__default__),
  fibonacci: __withRetries__(__fibonacci__),
  immediately: __withRetries__(__immediately__),
  progressive: __withRetries__(__progressive__)
});

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
