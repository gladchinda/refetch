function noop() {}

function constant(value) {
  return function __constant__() {
    return value;
  };
}

function isFunction(value) {
  return typeof value === 'function';
}

function isPromise(value) {
  return value && typeof value === 'object' && isFunction(value.then);
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isResponse(value) {
  return value instanceof Response && isFunction(value.clone);
}

function isSignal(value) {
  return value instanceof AbortSignal && typeof value.aborted === 'boolean';
}

function isAborted(signal) {
  return isSignal(signal) && !!signal.aborted;
}

export {
  constant,
  isAborted,
  isFunction,
  isPlainObject,
  isPromise,
  isResponse,
  isSignal,
  noop
};
