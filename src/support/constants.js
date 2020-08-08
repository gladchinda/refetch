/**
 * The default delay duration for fetch retries in milliseconds.
 * This will be used as fallback whenever an invalid delay sequence
 * is provided or whenever the delay duration could not be resolved
 * from a call to the delay sequence function.
 */
const REFETCH_DEFAULT_DELAY = 0; // 0ms

/**
 * The minimum allowed fetch timeout duration in milliseconds.
 * This is the minimum value that can be specified as fetch timeout.
 * Any value lower than this will be taken to be `0`, which means the
 * fetch will never timeout.
 */
const REFETCH_MINIMUM_TIMEOUT = 50; // 50ms

/**
 * The maximum allowed fetch timeout duration in milliseconds.
 * This is the maximum value that can be specified as fetch timeout.
 * Any value higher than this will be clapmed to this value.
 */
const REFETCH_MAXIMUM_TIMEOUT = 100000; // 100s

/**
 * The maximum allowed retry delay amplifier value (integer only).
 * Retry delay amplifiers are used to multiply retry delay durations
 * from delay sequence functions in order to scale up the delay
 * durations (amplification).
 */
const MAX_RETRY_AMPLIFIER = 10;

/**
 * The maximum allowed retry delay duration before amplification in
 * milliseconds. The retry delay durations are such that they will
 * never exceed this value, regardless of the number of retries.
 */
const MAX_RETRY_DELAY_UNAMPLIFIED = 10000; // 10s

/**
 * A list of fetch initialization options that can be pre-configured
 * on a refetch (fetch proxy) instance. These options here have the
 * same meaning as what is defined in the Fetch API specification.
 */
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
  MAX_RETRY_AMPLIFIER,
  MAX_RETRY_DELAY_UNAMPLIFIED,
  REFETCH_DEFAULT_DELAY,
  REFETCH_MAXIMUM_TIMEOUT,
  REFETCH_MINIMUM_TIMEOUT
};
