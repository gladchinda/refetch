import { ABORT_ERROR } from './error';
import { PENDING_PROMISE } from './promise';
import { isSignal, isAborted } from './utils';

/**
 * Creates an abort controller and returns an object containing
 * the abort signal and `abort()` method associated with the abort
 * controller.
 *
 * The `abort()` method in the returned object is a bound function
 * for the original `abort` method of the created abort controller.
 * This makes it possible to call the `abort()` method from the
 * returned object, like you would from the abort controller.
 *
 * @returns {object} An object with `signal` and `abort()` method.
 */
function createAbortController() {
  const controller = new AbortController();
  const { signal } = controller;
  return { signal, abort: controller.abort.bind(controller) };
}

/**
 * Takes an abort signal and returns a promise that will be rejected
 * with the `ABORT_ERROR` if the signal transitions to the `aborted`
 * state.
 *
 * If the `signal` specified is not an abort signal, or if it is an
 * abort signal that is already aborted, then the `PENDING_PROMISE`
 * is returned instead (which is a forever pending promise).
 *
 * @param {*} signal The supposed abort signal.
 * @returns {Promise} Either an abort or a forever pending promise.
 * @see ABORT_ERROR
 * @see PENDING_PROMISE
 */
function createAbortPromise(signal) {
  return isSignal(signal) && !isAborted(signal)
    ? new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(ABORT_ERROR));
      })
    : PENDING_PROMISE;
}

export { createAbortController, createAbortPromise };
