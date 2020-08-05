import { noop } from './utils';

/**
 * A forever pending promise that will never get settled.
 * The promise is frozen for global usage in order to prevent
 * unwanted extensions.
 *
 * The pending promise is created by passing a no-op function
 * to the `Promise` constructor (`new Promise(function(){})`).
 * Alternatively, `Promise.race([])` can be used.
 */
const PENDING_PROMISE = Object.freeze(new Promise(noop));

/**
 * A `Promise` bound function for the static `Promise.reject()`
 * method, making it possible to call the bound function just as
 * you would `Promise.reject`. The bound function is frozen for
 * global usage in order to prevent unwanted extensions.
 */
const Reject = Object.freeze(Promise.reject.bind(Promise));

/**
 * A `Promise` bound function for the static `Promise.resolve()`
 * method, making it possible to call the bound function just as
 * you would `Promise.resolve`. The bound function is frozen for
 * global usage in order to prevent unwanted extensions.
 */
const Resolve = Object.freeze(Promise.resolve.bind(Promise));

export { PENDING_PROMISE, Reject, Resolve };
