import { Reject } from './promises';
import { TIMEOUT_ERROR } from './error';
import { createAbortController } from './abort';
import { REFETCH_DEFAULT_DELAY } from './constants';
import { constant, isAborted, isFunction } from './utils';

const DefaultDelaySequence = Object.freeze(constant(REFETCH_DEFAULT_DELAY));

function createAbortableDelay(ms, resolveWith = () => Reject(TIMEOUT_ERROR)) {
  let timerId = 0;
  const { signal, abort } = createAbortController();

  const promise = isAborted(signal)
    ? clear(Reject)
    : new Promise((resolve, reject) => {
        timerId = setTimeout(
          () =>
            clear(() =>
              resolve(isFunction(resolveWith) ? resolveWith() : resolveWith)
            ),
          ms
        );
        signal.addEventListener('abort', () => clear(reject));
      });

  return Object.defineProperty(promise, 'clear', { value: abort });

  function clear(callback) {
    timerId && clearTimeout(timerId);
    timerId = 0;

    return (clear = function clear(callback) {
      return isFunction(callback) && callback();
    })(callback);
  }
}

function parseRetryDelay(delay, fallback = REFETCH_DEFAULT_DELAY) {
  delay = Math.max(0, (delay = +parseFloat(delay)));
  delay = Number.isFinite(delay) ? delay : +parseFloat(fallback);
  return Number.isFinite(delay) ? delay : REFETCH_DEFAULT_DELAY;
}

export { createAbortableDelay, DefaultDelaySequence, parseRetryDelay };
