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
  isPlainObject,
  withProperties
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

const __FetchContextProto__ = Object.freeze(
  withProperties.call(Object.create(null), {
    $delay(delayOrSequence) {
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
        delayOrSequence !== this.retryDelaySequence &&
        (this.retryDelaySequence = delayOrSequence);

      return this;
    },

    $init(initDefaults) {
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

      this.initResolvers = resolvers;
      return this;
    },

    $limit(count) {
      count = (count = +count) === 0 ? 0 : Math.max(0, count);

      Number.isInteger(count) &&
        this.limit !== (count = count === 0 ? Infinity : count) &&
        (this.limit = count);

      return this;
    },

    $many() {
      this.multiple === false && (this.multiple = true);
      return this;
    },

    $one() {
      this.multiple === true && (this.multiple = false);
      return this;
    },

    $retry(...predicates) {
      predicates = predicates.filter(isFunction);
      const count = predicates.length;

      (count || (count === 0 && count !== this.retryPredicates.length)) &&
        (this.retryPredicates = predicates);

      return this;
    },

    $timeout(duration) {
      duration =
        (duration = +duration) === 0
          ? 0
          : Math.max(
              REFETCH_MINIMUM_TIMEOUT,
              Math.min(duration, REFETCH_MAXIMUM_TIMEOUT)
            );

      Number.isFinite(duration) &&
        this.timeout !== duration &&
        (this.timeout = duration);

      return this;
    },

    $$clone() {
      return __createFetchContextObject__.call(this);
    }
  })
);

function __createFetchContextObject__() {
  const $this = this;
  const clone =
    isPlainObject($this) &&
    Object.getPrototypeOf($this) === __FetchContextProto__;

  return withProperties.call(
    Object.create(__FetchContextProto__),
    {
      limit: clone ? $this.limit : 1,
      timeout: clone ? $this.timeout : 0,
      multiple: clone ? $this.multiple : true,
      initResolvers: [...(clone ? $this.initResolvers : [])],
      retryPredicates: [...(clone ? $this.retryPredicates : [])],
      retryDelaySequence: clone
        ? $this.retryDelaySequence
        : DefaultDelaySequence
    },
    true
  );
}

function Refetch() {
  const CHAINED_MODIFIER_PROPERTIES = {
    delay: {
      value: function (delayOrSequence) {
        const $context = this.$context.$$clone().$delay(delayOrSequence);
        return createFetch.call($context);
      }
    },

    init: {
      value: function (initDefaults) {
        const $context = this.$context.$$clone().$init(initDefaults);
        return createFetch.call($context);
      }
    },

    limit: {
      value: function (count) {
        const $context = this.$context.$$clone().$limit(count);
        return createFetch.call($context);
      }
    },

    many: {
      get() {
        const $context = this.$context.$$clone().$many();
        return createFetch.call($context);
      }
    },

    one: {
      get() {
        const $context = this.$context.$$clone().$one();
        return createFetch.call($context);
      }
    },

    retry: {
      value: function (...predicates) {
        const $context = this.$context.$$clone().$retry(...predicates);
        return createFetch.call($context);
      }
    },

    timeout: {
      value: function (duration) {
        const $context = this.$context.$$clone().$timeout(duration);
        return createFetch.call($context);
      }
    }
  };

  return createFetch.call(__createFetchContextObject__());

  function createFetch() {
    let abort;
    let abortSignal;

    const $this = this;
    const hasTimeout = $this.timeout > 0;
    const singularRequest = $this.multiple !== true;

    refreshAbortController();

    function refreshAbortController() {
      ({ abort, signal: abortSignal } = createAbortController());
      abortSignal.addEventListener('abort', refreshAbortController);
    }

    function shouldAttemptRetry(responseOrError) {
      return Promise.all(
        $this.retryPredicates.map((predicate) => {
          return Resolve(
            predicate(
              isResponse(responseOrError)
                ? responseOrError.clone()
                : responseOrError
            )
          ).then(Boolean, () => false);
        })
      ).then((retryTests) => retryTests.reduce((a, b) => a || b, false));
    }

    // function shouldAttemptRetry(responseOrError) {
    //   function* __shouldAttemptRetry__(responseOrError) {
    //     let retry = yield false;

    //     for (let predicate of $this.retryPredicates) {
    //       retry = yield Resolve(
    //         predicate(
    //           isResponse(responseOrError)
    //             ? responseOrError.clone()
    //             : responseOrError
    //         )
    //       ).then(Boolean, () => false);

    //       if (retry === true) return;
    //     }
    //   }

    //   function synchronize(fn) {
    //     function next(iterator, callback, prev = undefined) {
    //       const item = iterator.next(prev);
    //       const value = item.value;

    //       if (item.done) return callback(prev);

    //       if (isPromise(value)) {
    //         value.then((value) =>
    //           setTimeout(() => next(iterator, callback, value))
    //         );
    //       } else {
    //         setTimeout(() => next(iterator, callback, value));
    //       }
    //     }

    //     return (synchronize = function synchronize(fn) {
    //       return (...args) =>
    //         new Promise((resolve) => next(fn(...args), resolve));
    //     })(fn);
    //   }

    //   return (shouldAttemptRetry = synchronize(__shouldAttemptRetry__))(
    //     responseOrError
    //   );
    // }

    function createRetryHandler(retryFn, abortPromises) {
      retryFn = isFunction(retryFn) ? retryFn : noop;
      abortPromises = [].concat(abortPromises).filter(isPromise);

      let retries = 0;

      return function __retryHandler__(responseOrError) {
        return shouldAttemptRetry(responseOrError).then((retry) =>
          retry && ++retries < $this.limit && responseOrError !== ABORT_ERROR
            ? new Promise((resolve, reject) => {
                const $timeout = createAbortableDelay(
                  parseRetryDelay($this.retryDelaySequence(retries)),
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
      $this.initResolvers.forEach((resolver) => resolver(init));
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
          ? createAbortableDelay($this.timeout)
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

    Object.defineProperties(
      Object.defineProperty(__fetch__, 'abort', {
        enumerable: true,
        get() {
          return abort;
        }
      }),
      CHAINED_MODIFIER_PROPERTIES
    );

    return Object.defineProperty(__fetch__, '$context', {
      value: Object.freeze($this)
    });
  }
}

export default Refetch;
