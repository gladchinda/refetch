/**
 * A no-op function (that does nothing). This can be used as fallback
 * wherever a callback is required but not provided. Its return value
 * is `undefined`.
 */
function noop() {}

/**
 * Returns a new function that is guaranteed to always return the value
 * specified whenever it is called, regardless of the arguments it will
 * be called with. This is a higher-order function.
 *
 * @param {*} value The value (constant).
 * @return {function} Function that will always return `value`.
 */
function constant(value) {
  return function __constant__() {
    return value;
  };
}

/**
 * Checks if the given value is callable. Particularly, if the value is
 * a function or an object method.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is callable, and false otherwise.
 */
function isFunction(value) {
  return value && typeof value === 'function';
}

/**
 * Checks if the given value is a thenable (an object that implements a
 * `then()` method), particularly a promise. This check is not extensive
 * enough for checking if a value is a promise.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is a promise, and false otherwise.
 */
function isPromise(value) {
  return (
    value &&
    typeof value === 'object' &&
    isFunction(value.then) &&
    value instanceof Promise
  );
}

/**
 * Checks if the given value is a plain JavaScript object. The check
 * isn't foolproof, but will be fairly reliable for most objects.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is a plain JS object, false otherwise.
 */
function isPlainObject(value) {
  return value && Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Checks if the given value is a plain JavaScript object without any
 * own properties. It relies on the `isPlainObject()` helper.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is an empty plain JS object, false otherwise.
 * @see isPlainObject
 */
function isEmptyObject(value) {
  return isPlainObject(value) && Object.getOwnPropertyNames(value).length === 0;
}

/**
 * Checks if the given value is a `Response` object.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is a Response object, false otherwise.
 */
function isResponse(value) {
  return (
    value &&
    typeof value === 'object' &&
    isFunction(value.clone) &&
    value instanceof Response
  );
}

/**
 * Checks if the given value is an object that implements the
 * `AbortSignal` interface.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is an abort signal, false otherwise.
 */
function isSignal(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.aborted === 'boolean' &&
    value instanceof AbortSignal
  );
}

/**
 * Checks if the given value is an abort signal that is in the
 * `aborted` state.
 *
 * @param {*} value The value to check.
 * @return {boolean} True if `value` is an aborted signal, false otherwise.
 */
function isAborted(signal) {
  return isSignal(signal) && signal.aborted;
}

/**
 * Helper function for defining multiple non-configurable data properties
 * on an object from a `properties` object of property-value pairs. This
 * function leverages `Object.defineProperties()`, hence it might throw
 * errors when trying to redefine non-configurable properties that have
 * been previously defined on the target object.
 *
 * The second argument can be used to specify the enumerable behavior of
 * all the defined properties.
 *
 * @param {object} properties An object of property-value pairs.
 * @param {boolean} enumerable A boolean for the enumerable behavior of the properties.
 * @returns {object} The target object with the defined properties.
 */
function withProperties(properties, enumerable = true) {
  // This ensures that enumerable is `false` only when it is explicitly
  // passed as `false`, otherwise it is `true`.
  enumerable = enumerable !== false;

  // Return the target object (now having the defined properties).
  return Object.defineProperties(
    this,

    // `Object.keys()` together with `Array.prototype.reduce` is used here
    // instead of `Object.fromEntries()` or `Object.entries()` to eliminate
    // the need of polyfills for this to run in ES5 targets.
    Object.keys(properties).reduce((descriptors, prop) => {
      descriptors[prop] = {
        enumerable,
        value: properties[prop]
      };
      return descriptors;
    }, Object.create(null))
  );
}

export {
  constant,
  isAborted,
  isEmptyObject,
  isFunction,
  isPlainObject,
  isPromise,
  isResponse,
  isSignal,
  noop,
  withProperties
};
