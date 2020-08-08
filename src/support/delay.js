import { Reject } from './promises';
import { TIMEOUT_ERROR } from './error';
import { createAbortController } from './abort';
import { constant, isAborted, isFunction } from './utils';

import {
  REFETCH_DEFAULT_DELAY,
  MAX_RETRY_AMPLIFIER,
  MAX_RETRY_DELAY_UNAMPLIFIED
} from './constants';

/**
 * The name of the property key that will be used to cache the
 * value of the optimal retry count in a delay sequence
 * function.
 */
const OPTIMAL_RETRY_KEY = '___REFETCH$$OPTIMAL$$RETRY___';

/**
 * Delay sequence function that always returns the value stored
 * in the `REFETCH_DEFAULT_DELAY` constant. The delay function
 * is frozen for global and external usage in order to prevent
 * unwanted extensions.
 *
 * The delay sequence function is returned from a call to the
 * higher-order `constant()` function.
 *
 * @see constant
 * @see REFETCH_DEFAULT_DELAY
 */
const DefaultDelaySequence = Object.freeze(constant(REFETCH_DEFAULT_DELAY));

/**
 * Higher-order retry delay sequence function that takes an
 * `amplifier` value and returns a retry delay sequence
 * function that is based on `__fibonacciSequence__`.
 *
 * The retry delay sequence function is created using the
 * `__sequenceFactory__()` helper and is frozen for global and
 * external usage in order to prevent unwanted extensions.
 *
 * @see __sequenceFactory__
 * @see __fibonacciSequence__
 */
const FibonacciDelaySequence = __sequenceFactory__(__fibonacciSequence__);

/**
 * Higher-order retry delay sequence function that takes an
 * `amplifier` value and returns a retry delay sequence
 * function that is based on `__progressiveSequence__`.
 *
 * The retry delay sequence function is created using the
 * `__sequenceFactory__()` helper and is frozen for global and
 * external usage in order to prevent unwanted extensions.
 *
 * @see __sequenceFactory__
 * @see __progressiveSequence__
 */
const ProgressiveDelaySequence = __sequenceFactory__(__progressiveSequence__);

/**
 * A retry delay sequence function that is based on the
 * Fibonacci sequence. The numbers are created using the
 * `__fibonacci__()` helper.
 *
 * @param {*} retry The retry count.
 * @returns {number} The corresponding retry delay.
 * @see __fibonacci__
 */
function __fibonacciSequence__(retry) {
  return __fibonacci__(retry) * 10;
}

/**
 * A retry delay sequence function that is based on some
 * sequence that progresses with powers of 2 for every four
 * consecutive items in the sequence. The powers of 2 are
 * maxed out at a predefined value (1024 in this case).
 *
 * @param {*} retry The retry count.
 * @returns {number} The corresponding retry delay.
 */
function __progressiveSequence__(retry) {
  return (1 << Math.max(retry >> 2, 10)) * 10;
}

/**
 * A higher-order function that takes a retry delay sequence
 * function and returns an amplifiable factory function for that
 * retry delay sequence function.
 *
 * The returned factory function can take an `amplifier` argument
 * that determines how much the delay should be amplified. The
 * value of this argument has a bound, and can never be zero (0).
 * If it is zero, or not a number, then it is taken to be one (1).
 *
 * The returned factory function is frozen for global or external
 * usage in order to prevent unwanted extensions. Also, the
 * returned factory function is a higher-order function that returns
 * a delay sequence function. The `retry` count argument, as well as
 * the return value from `sequenceFn()` is bounded based on some
 * predefined constants. This happens before amplification happens.
 *
 * @param {*} sequenceFn The supposed retry delay sequence function.
 * @returns {function} A retry delay sequence factory function (amplifiable).
 */
function __sequenceFactory__(sequenceFn) {
  sequenceFn = isFunction(sequenceFn) ? sequenceFn : DefaultDelaySequence;

  return Object.freeze(function __factory__(amplifier) {
    let optimalRetryCount;

    // If the optimal retry count has been cached on the sequence
    // function, use that value to initialize `optimalRetryCount`.
    if (
      !(
        sequenceFn === DefaultDelaySequence ||
        typeof sequenceFn[OPTIMAL_RETRY_KEY] === 'undefined'
      )
    ) {
      optimalRetryCount = sequenceFn[OPTIMAL_RETRY_KEY];
    }

    // Ensure the value of `amplifier` is within bounds.
    // If `0` or an invalid value is passed, default to `1`.
    amplifier = Math.min(Math.max(0, amplifier), MAX_RETRY_AMPLIFIER) || 1;

    return function __sequence__(retry) {
      // If an invalid `retry` value is passed, default to `0`.
      retry = Math.max(0, Math.min(retry, Infinity)) || 0;

      // If the current `retry` count exceeds the optimal retry
      // count, don't delegate call to the sequence function,
      // rather use the value of the maximum retry delay.
      // If the sequence function is called, ensure that its return
      // value is within bounds.
      const retryDelay =
        retry >= optimalRetryCount
          ? MAX_RETRY_DELAY_UNAMPLIFIED
          : Math.min(sequenceFn(retry), MAX_RETRY_DELAY_UNAMPLIFIED);

      // Update the `optimalRetryCount` with the current `retry`
      // if it has not been set yet, and the max retry delay has
      // been exceeded by the delay sequence function.
      // Also attempt to cache the value of the optimal retry count
      // in the optimal retry field of the sequence function.
      if (
        retryDelay >= MAX_RETRY_DELAY_UNAMPLIFIED &&
        typeof optimalRetryCount === 'undefined'
      ) {
        try {
          if (sequenceFn !== DefaultDelaySequence) {
            Object.defineProperty(sequenceFn, OPTIMAL_RETRY_KEY, {
              value: retry
            });
          }
        } finally {
          optimalRetryCount = retry;
        }
      }

      // Apply amplification and return the amplified retry delay.
      return retryDelay * amplifier;
    };
  });
}

/**
 * Helper function for recursively generating Fibonacci sequence
 * numbers with memoization (cached results).
 *
 * The results cache is created on the first call, and then the
 * function is overwritten internally to prevent recreating a new
 * cache on subsequent calls.
 *
 * @param {number} n The position in the sequence.
 * @returns {number} The number in the nth position of the sequence.
 */
function __fibonacci__(n) {
  // Create the results cache array (only on the first call).
  const cache = [];

  // Overwrite the original function (only on the first call),
  // to avoid recreating cache and overwriting the function on
  // subsequent calls.
  __fibonacci__ = function fib(n) {
    switch (true) {
      case n > 0 && cache[n]: {
        return cache[n];
      }

      case n <= 0:
        return (cache[n] = 0);
      case n <= 2:
        return (cache[n] = 1);

      default: {
        return (cache[n] = fib(n - 1) + fib(n - 2));
      }
    }
  };

  // Call the owerwritten function with the passed argument
  // and return the result.
  return __fibonacci__(n);
}

/**
 * Returns a promise that resolves after a specified delay in
 * milliseconds. This delay is specified as the first argument.
 * A value to resolve the promise with before it is returned can
 * be provided as a second argument. If the `resolvedWith` value
 * is a function, then its return value is used instead.
 *
 * The returned promise has an additional .clear() method defined
 * on it that can be used to clear the timeout even before the
 * delay elapses. This method actually delagates its call to the
 * `abort()` method of the internal abort controller. Also,
 * aborting the signal ensures that the internal timeout is
 * cleared and reset before the promise is settled.
 *
 * If `resolvedWith` is not passed, the abort delay promise will
 * be resolved with an already rejected promise with `TIMEOUT_ERROR`
 * by default.
 *
 * @param {*} ms The delay duration in milliseconds.
 * @param {*} resolveWith The value to resolve the promise with.
 * @returns {Promise} The abort delay promise with an extra `clear()` method.
 */
function createAbortableDelay(ms, resolveWith = () => Reject(TIMEOUT_ERROR)) {
  // Initialize the timer ID that will be used to hold the value
  // of the `setTimeout()` timer ID.
  let timerId = 0;

  // Create an abort controller for this abortable delay promise.
  const { signal, abort } = createAbortController();

  // If the abort signal is already in an aborted state, clear and
  // reset the timeout, then return an already rejected promise.
  // Otherwise, return the new abort delay promise.
  const promise = isAborted(signal)
    ? clear(Reject)
    : new Promise((resolve, reject) => {
        /**
         * Settle the promise by fulfilling it with the value passed
         * as `resolveWith`, after the delay specified using the `ms`
         * argument has been elapsed, using `setTimeout()`.
         *
         * Before the promise is settled, ensure that the timeout is
         * cleared and reset. If the value passed as `resolvedWith` is
         * a function, then fulfil the promise with its return value
         * instead.
         */
        timerId = setTimeout(() => {
          clear(() => {
            resolve(isFunction(resolveWith) ? resolveWith() : resolveWith);
          });
        }, ms);

        // Setup an abort event listener on the abort signal.
        // When the signal is aborted, clear the timeout and then
        // settle the abort delay promise with a rejection.
        signal.addEventListener('abort', () => {
          clear(reject);
        });
      });

  // Augment the abort delay promise with a `clear()` method that
  // delegates call to the underlying controller's `abort()` method.
  // Return the augmented promise object.
  return Object.defineProperty(promise, 'clear', { value: abort });

  function clear(callback) {
    // Effectively clear the timer ID set by the initial call to
    // `setTimeout()` and reset the `timerID` variable. This can
    // only happen once (only on the first call to the `clear()`
    // function).
    timerId && clearTimeout(timerId);
    timerId = 0;

    // Overwrite the original `clear` function and trigger it with
    // the callback provided. The `callback` will only be called if
    // it is callable, otherwise it is ignored.
    return (clear = function clear(callback) {
      return isFunction(callback) && callback();
    })(callback);
  }
}

/**
 * Parses the given `delay` value as a number and ensures that
 * it's a valid delay value. If it is not, then the fallback is
 * used instead. And if the fallback, when parsed, doesn't result
 * to a valid delay value, then the `REFETCH_DEFAULT_DELAY` is
 * returned instead.
 *
 * @param {*} delay A supposed number representing the retry delay.
 * @param {*} fallback A fallback number that will be parsed or used
 *                     if the value passed as `delay` is invalid.
 * @returns {number} A number representing the parsed retry delay.
 */
function parseRetryDelay(delay, fallback = REFETCH_DEFAULT_DELAY) {
  delay = Math.max(0, (delay = +parseFloat(delay)));
  delay = Number.isFinite(delay) ? delay : +parseFloat(fallback);
  return Number.isFinite(delay) ? delay : REFETCH_DEFAULT_DELAY;
}

export {
  createAbortableDelay,
  DefaultDelaySequence,
  FibonacciDelaySequence,
  parseRetryDelay,
  ProgressiveDelaySequence
};
