import { ABORT_ERROR, TIMEOUT_ERROR } from './support/error';
import { Resolve, Reject, PENDING_PROMISE } from './support/promise';
import { createAbortPromise, createAbortController } from './support/abort';

import {
  DefaultDelaySequence,
  parseRetryDelay,
  createAbortableDelay
} from './support/delay';

import {
  constant,
  isAborted,
  isResponse,
  isPromise,
  isFunction,
  isPlainObject
} from './support/utils';

import {
  initHeadersResolver,
  initOptionResolver
} from './support/init_options';

import {
  FETCH_INIT_OPTIONS,
  REFETCH_DEFAULT_DELAY,
  REFETCH_MINIMUM_TIMEOUT,
  REFETCH_MAXIMUM_TIMEOUT
} from './support/constants';

function Refetch() {
  const CHAINED_MODIFIER_PROPERTIES = {
    delay: {
      value: function (delayOrSequence) {
        if (!isFunction(delayOrSequence)) {
          switch ((delayOrSequence = parseRetryDelay(delayOrSequence))) {
            case REFETCH_DEFAULT_DELAY: {
              delayOrSequence = DefaultDelaySequence;
              break;
            }

            default: {
              delayOrSequence = constant(delayOrSequence);
            }
          }
        }

        isFunction(delayOrSequence) &&
          delayOrSequence !== retryDelaySequence &&
          ((retryDelaySequence = delayOrSequence), ($fetch = createFetch()));

        return $fetch;
      }
    },

    init: {
      value: function (initDefaults) {
        const { headers, ...defaults } = isPlainObject(initDefaults)
          ? initDefaults
          : {};

        const resolvers = Object.keys(defaults).reduce((resolvers, option) => {
          if (FETCH_INIT_OPTIONS.indexOf(option) >= 0) {
            const defaultValue = defaults[option];

            if (typeof defaultValue !== 'undefined') {
              resolvers.push(initOptionResolver(option, defaultValue));
            }
          }

          return resolvers;
        }, []);

        if (typeof headers !== 'undefined') {
          resolvers.push(initHeadersResolver(headers));
        }

        initResolvers = resolvers;
        return ($fetch = createFetch());
      }
    },

    limit: {
      value: function (count) {
        count = (count = +count) === 0 ? 0 : Math.max(0, count);

        Number.isInteger(count) &&
          limit !== (count = count === 0 ? Infinity : count) &&
          ((limit = count), ($fetch = createFetch()));

        return $fetch;
      }
    },

    many: {
      get() {
        multiple === false && ((multiple = true), ($fetch = createFetch()));
        return $fetch;
      }
    },

    one: {
      get() {
        multiple === true && ((multiple = false), ($fetch = createFetch()));
        return $fetch;
      }
    },

    retry: {
      value: function (...predicates) {
        predicates = predicates.filter(isFunction);
        const count = predicates.length;

        (count || (count === 0 && count !== retryPredicates.length)) &&
          ((retryPredicates = predicates), ($fetch = createFetch()));

        return $fetch;
      }
    },

    timeout: {
      value: function (duration) {
        duration =
          (duration = +duration) === 0
            ? 0
            : Math.max(
                REFETCH_MINIMUM_TIMEOUT,
                Math.min(duration, REFETCH_MAXIMUM_TIMEOUT)
              );

        Number.isFinite(duration) &&
          timeout !== duration &&
          ((timeout = duration), ($fetch = createFetch()));

        return $fetch;
      }
    }
  };

  let limit = 1;
  let timeout = 0;
  let multiple = true;
  let initResolvers = [];
  let retryPredicates = [];
  let retryDelaySequence = DefaultDelaySequence;

  let $fetch = createFetch();

  return $fetch;

  function createFetch() {
    let abort;
    let abortSignal;

    const hasTimeout = timeout > 0;
    const singularRequest = multiple !== true;

    refreshAbortController();

    function refreshAbortController() {
      ({ abort, signal: abortSignal } = createAbortController());
      abortSignal.addEventListener('abort', refreshAbortController);
    }

    function shouldAttemptRetry(responseOrError) {
      function* __shouldAttemptRetry__(responseOrError) {
        let retry = yield false;

        for (let predicate of retryPredicates) {
          retry = yield Resolve(
            predicate(
              isResponse(responseOrError)
                ? responseOrError.clone()
                : responseOrError
            )
          ).then(Boolean, () => false);

          if (retry === true) return;
        }
      }

      function synchronize(fn) {
        function next(iterator, callback, prev = undefined) {
          const item = iterator.next(prev);
          const value = item.value;

          if (item.done) return callback(prev);

          if (isPromise(value)) {
            value.then((value) =>
              setTimeout(() => next(iterator, callback, value))
            );
          } else {
            setTimeout(() => next(iterator, callback, value));
          }
        }

        return (synchronize = function synchronize(fn) {
          return (...args) =>
            new Promise((resolve) => next(fn(...args), resolve));
        })(fn);
      }

      return (shouldAttemptRetry = synchronize(__shouldAttemptRetry__))(
        responseOrError
      );
    }

    function createRetryHandler(retryFn, abortPromises) {
      retryFn = isFunction(retryFn) ? retryFn : noop;
      abortPromises = [].concat(abortPromises).filter(isPromise);

      let retries = 0;

      return function __retryHandler__(responseOrError) {
        return shouldAttemptRetry(responseOrError).then((retry) =>
          retry && ++retries < limit && responseOrError !== ABORT_ERROR
            ? new Promise((resolve, reject) => {
                const $timeout = createAbortableDelay(
                  parseRetryDelay(retryDelaySequence(retries)),
                  retryFn
                );

                Promise.race([
                  $timeout,
                  createAbortPromise(abortSignal),
                  ...abortPromises
                ])
                  .catch((err) => {
                    err === ABORT_ERROR &&
                      isFunction($timeout.clear) &&
                      $timeout.clear();
                    return Reject(err);
                  })
                  .then(resolve, reject);
              })
            : (isResponse(responseOrError) ? Resolve : Reject)(responseOrError)
        );
      };
    }

    function resolveInitOptions(init) {
      init = isPlainObject(init) ? init : {};
      initResolvers.forEach((resolver) => resolver(init));
      return init;
    }

    function __fetch__(...args) {
      singularRequest && abort();

      const [resource, init] = args;
      const { signal: outerSignal, ...initOptions } = resolveInitOptions(init);
      const outerAbortPromise = createAbortPromise(outerSignal);
      const __retry__ = createRetryHandler(__refetch__, [outerAbortPromise]);

      return __refetch__();

      function __refetch__() {
        if (isAborted(outerSignal)) {
          return Reject(ABORT_ERROR);
        }

        if (isAborted(abortSignal)) {
          refreshAbortController();
        }

        const $inner = createAbortController();
        const $timeout = hasTimeout
          ? createAbortableDelay(timeout)
          : PENDING_PROMISE;

        const $fetch = Promise.race([
          $timeout,
          createAbortPromise(abortSignal),
          outerAbortPromise,
          fetch(resource, { ...initOptions, signal: $inner.signal })
        ])
          .catch((err) => {
            (err === ABORT_ERROR || err === TIMEOUT_ERROR) && $inner.abort();
            return Reject(err);
          })
          .finally(() => {
            hasTimeout && isFunction($timeout.clear) && $timeout.clear();
          });

        return $fetch.then(__retry__, __retry__);
      }
    }

    return Object.defineProperties(
      Object.defineProperty(__fetch__, 'abort', {
        enumerable: true,
        get() {
          return abort;
        }
      }),
      CHAINED_MODIFIER_PROPERTIES
    );
  }
}

export default Refetch;
