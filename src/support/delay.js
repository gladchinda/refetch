import { Reject } from './promises';
import { TIMEOUT_ERROR } from './error';
import { createAbortController } from './abort';
import { REFETCH_DEFAULT_DELAY } from './constants';
import { constant, isAborted, isFunction } from './utils';

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
 * @param {(function|*)} resolveWith The value to resolve the promise with.
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

export { createAbortableDelay, DefaultDelaySequence, parseRetryDelay };
