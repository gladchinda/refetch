import Retry from './retry';
import {
  delay,
  exposeAsProperties,
  getBoundedNumber,
  getNumber,
  isFunction,
  isObject,
  resolveCallback
} from './support/helpers';

function Fetch(config) {
  let __timeout__,
    __maxRetries__,
    __delaySequence__,
    __onAbort__,
    __onRetry__,
    __onTimeout__;

  let { timeout, retries, onabort, onretry, ontimeout } = isObject(config)
    ? config
    : {};

  let { max, sequence } = isObject(retries)
    ? retries
    : isFunction(retries)
    ? { sequence: retries }
    : { max: retries };

  isFunction(onabort) && (__onAbort__ = onabort);
  isFunction(onretry) && (__onRetry__ = onretry);
  isFunction(ontimeout) && (__onTimeout__ = ontimeout);

  __delaySequence__ = isFunction(sequence) ? sequence : Retry.default;

  max = getNumber(max);
  timeout = getNumber(timeout);

  if (max === Infinity || max < 1) {
    isFunction(sequence) && (__maxRetries__ = 1);
  } else {
    __maxRetries__ = getBoundedNumber(max, 1, __delaySequence__.retries);
  }

  if (!(timeout === Infinity || timeout < 0)) {
    __timeout__ = getBoundedNumber(timeout);
  }

  Object.defineProperty(this, 'fetch', {
    get() {
      let $delay,
        $retries,
        $controller,
        $delaySequence = __delaySequence__;

      function $abort() {
        $controller && $controller.abort();
      }

      return exposeAsProperties(
        function (resource, init) {
          $abort();

          $delay = 0;
          $retries = 0;
          $controller = new AbortController();

          const { signal } = $controller;
          const ABORT_ERROR = new DOMException('Aborted', 'AbortError');
          const FETCH_OPTIONS = isObject(init) ? init : {};

          const __withFetchData__ = (innerFn) => (data) => {
            return (
              isFunction(innerFn) &&
              innerFn({
                ...(isObject(data) ? data : {}),
                fetch: { resource, options: FETCH_OPTIONS }
              })
            );
          };

          const __fetch__ = () => {
            const __delay__ = delay($delay, () => {
              isFunction(__onRetry__) &&
                $retries > 0 &&
                __withFetchData__(__onRetry__)({
                  retry: {
                    current: $retries,
                    delay: $delay,
                    max: __maxRetries__
                  }
                });

              return fetch(resource, { ...FETCH_OPTIONS, signal })
                .then((response) =>
                  response.ok ? response : Promise.reject(response)
                )
                .catch((err) => {
                  if (
                    err.name !== 'AbortError' &&
                    __maxRetries__ &&
                    $retries++ < __maxRetries__
                  ) {
                    $delay = $delaySequence($retries);
                    return __fetch__();
                  }

                  return Promise.reject(err);
                });
            });

            // This aborted promise ensures that the timeout created for the delay promise
            // is cleared when the signal aborts.
            // The AbortError is also returned in an already rejected promise.
            const __aborted__ = new Promise((resolve, reject) => {
              signal.addEventListener('abort', () => {
                __delay__.clear(() => reject(ABORT_ERROR));
              });
            });

            // Race between the delay and aborted promises.
            return Promise.race([__delay__, __aborted__]);
          };

          return (signal.aborted
            ? Promise.reject(ABORT_ERROR)
            : new Promise((resolve, reject) => {
                let __delay__;

                const __aborted__ = new Promise((resolve, reject) => {
                  signal.addEventListener('abort', () => reject(ABORT_ERROR));
                });

                if (typeof __timeout__ === 'number') {
                  __delay__ = delay(__timeout__, () => {
                    $abort();
                    isFunction(__onTimeout__) &&
                      __withFetchData__(__onTimeout__)({
                        timeout: __timeout__
                      });
                  });
                }

                Promise.race([__aborted__, __fetch__()])
                  .catch((err) => {
                    // This ensures that the timeout created for the delay promise
                    // is cleared when any of the above promises fulfills.
                    // Also, automatically reject the promise with the error.
                    return typeof __delay__ !== 'undefined' &&
                      isFunction(__delay__.clear)
                      ? __delay__.clear(() => Promise.reject(err))
                      : Promise.reject(err);
                  })
                  .then(resolve, reject);
              })
          ).catch((err) => {
            if (err.name === 'AbortError') {
              isFunction(__onAbort__) && __withFetchData__(__onAbort__)();
              return false;
            }

            return Promise.reject(err);
          });
        },
        { abort: $abort }
      );
    }
  });

  exposeAsProperties(
    this,
    {
      fresh: function (config) {
        return new Fetch(config);
      },

      extend: function (config) {
        let { timeout, retries, onabort, onretry, ontimeout } = isObject(config)
          ? config
          : {};

        let { max, sequence } = isObject(retries)
          ? retries
          : isFunction(retries)
          ? { sequence: retries }
          : { max: retries };

        sequence = isFunction(sequence) ? sequence : __delaySequence__;

        if (max === null) {
          max = undefined;
        } else {
          max = getNumber(max);
          max = getBoundedNumber(
            max === Infinity || max < 1 ? __maxRetries__ : max,
            1,
            sequence.retries
          );
        }

        if (timeout === null) {
          timeout = undefined;
        } else {
          timeout = getNumber(timeout);
          timeout =
            timeout === Infinity || timeout < 0
              ? __timeout__
              : getBoundedNumber(timeout);
        }

        return new Fetch({
          timeout,
          retries: { max, sequence },
          onabort: resolveCallback(onabort, __onAbort__),
          onretry: resolveCallback(onretry, __onRetry__),
          ontimeout: resolveCallback(ontimeout, __onTimeout__)
        });
      }
    },
    false
  );
}

export default Fetch;
