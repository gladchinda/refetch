import { constant, createError, createAbortError } from './utils';

const REFETCH_DEFAULT_DELAY = 0; // 0ms
const REFETCH_MINIMUM_TIMEOUT = 50; // 50ms
const REFETCH_MAXIMUM_TIMEOUT = 100000; // 100s

const ABORT_ERROR = Object.freeze(createAbortError());
const TIMEOUT_ERROR = Object.freeze(createError('Timeout', 'TimeoutError'));
const PENDING_PROMISE = Object.freeze(new Promise(noop));

const Reject = Object.freeze(Promise.reject.bind(Promise));
const Resolve = Object.freeze(Promise.resolve.bind(Promise));
const DefaultDelaySequence = Object.freeze(constant(REFETCH_DEFAULT_DELAY));

const FETCH_INIT_OPTIONS = [
  'cache',
  'credentials',
  'headers',
  'integrity',
  'keepalive',
  'method',
  'mode',
  'redirect',
  'referrer',
  'referrerPolicy',
  'signal'
];

export {
  ABORT_ERROR,
  DefaultDelaySequence,
  FETCH_INIT_OPTIONS,
  PENDING_PROMISE,
  REFETCH_DEFAULT_DELAY,
  REFETCH_MAXIMUM_TIMEOUT,
  REFETCH_MINIMUM_TIMEOUT,
  Reject,
  Resolve,
  TIMEOUT_ERROR
};
