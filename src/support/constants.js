const REFETCH_DEFAULT_DELAY = 0; // 0ms
const REFETCH_MINIMUM_TIMEOUT = 50; // 50ms
const REFETCH_MAXIMUM_TIMEOUT = 100000; // 100s

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
  FETCH_INIT_OPTIONS,
  REFETCH_DEFAULT_DELAY,
  REFETCH_MAXIMUM_TIMEOUT,
  REFETCH_MINIMUM_TIMEOUT
};
