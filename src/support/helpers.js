function constant(value) {
  return function _constantFn() {
    return value;
  }
}

function isFunction(value) {
  return typeof value === 'function';
}

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getNumber(value, defaultNumber) {
  return Number.isInteger(value = +value)
    ? value
    : Number.isInteger(defaultNumber) ? defaultNumber : Infinity;
}

function getBoundedNumber(value, min = 0, max = Infinity) {
  value = getNumber(value);
  min = getNumber(min);
  max = getNumber(max);

  if (min > max) {
    [min, max] = [max, min];
  }

  return Math.min(Math.max(min, value), max);
}

function resolveCallback(callback, fallback) {
  return (callback === null) ? undefined : (isFunction(callback) ? callback : fallback);
}

function exposeAsProperties(object, properties) {
  const enumerable = arguments[2] !== false;
  return Object.defineProperties(object, Object.fromEntries(
    Object.entries(properties)
      .map(([prop, value]) => [prop, { enumerable, value }])
  ));
}

function delay(ms, callback) {
  let timeout = 0;

  const promise = new Promise(resolve => {
    timeout = setTimeout(() => {
      resolve(Promise.resolve().then(() => {
        if (timeout && isFunction(callback)) {
          return callback();
        }
      }))
    }, (isNaN(ms = +ms) || ms < 0) ? 1000 : ms);
  });

  return exposeAsProperties(promise, {
    end: function (callback) {
      clearTimeout(timeout) && (timeout = 0);
      return Promise.resolve().then(callback);
    }
  });
}

export {
  constant,
  delay,
  exposeAsProperties,
  getBoundedNumber,
  getNumber,
  isFunction,
  isObject,
  resolveCallback
}
