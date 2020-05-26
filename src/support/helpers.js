// Higher-order function that retains the value passed to it as argument and
// returns an inner function that will always return that retained value,
// regardless of what arguments it is called with.
function constant(value) {
  return function _constantFn() {
    return value;
  };
}

// Helper function that determines whether the value passed to it is a function
// leveraging the typeof operator.
function isFunction(value) {
  return typeof value === 'function';
}

// Helper function that determines whether the value passed to it is a plain
// JavaScript object, leveraging the toString() method of the native Object
// prototype.
function isObject(value) {
  // Plain JavaScript objects should report an object type of `Object` as long
  // as the toString resolution behavior has not been tampered with. So this
  // check is safe to a large extent, although not completely fool proof.
  return Object.prototype.toString.call(value) === '[object Object]';
}

// Helper function that determines whether the value passed to it is an integer
// leveraging the ES2015 Number.isInteger method. It uses a polyfill for this
// method if it isn't available. The polyfill can be found on the MDN docs:
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
function isInteger(value) {
  return (isInteger =
    Number.isInteger ||
    function (value) {
      return (
        typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value
      );
    })(value);
}

// Helper function for resolving a value to an integer. It can optionally take
// a defaultNumber value as its second argument. If value when casted to number
// is an integer, it returns casted value. Otherwise, if defaultNumber when
// casted to a number is an integer, it returns casted defaultNumber, else it
// returns `Infinity`.
function getNumber(value, defaultNumber) {
  return isInteger((value = +value))
    ? value
    : isInteger((defaultNumber = +defaultNumber))
    ? defaultNumber
    : Infinity;
}

// Helper function for resolving a value to an integer, bounded between two
// values (`min` and `max`). The default min value is 0 and the default max
// value is Infinity. The returned value must always fall within the range of
// (min — max). The second and third arguments can be provided to specify a
// different min value and max value respectively.
function getBoundedNumber(value, min = 0, max = Infinity) {
  // Resolve the values passed in as arguments to numbers, using the getNumber
  // helper function.
  value = getNumber(value);
  min = getNumber(min);
  max = getNumber(max);

  // If the resolved min value is greater than the resolved max value, swap the
  // values before proceeding.
  if (min > max) {
    // Swap the min and max values (using array destructuring syntax)
    [min, max] = [max, min];
  }

  // Ensure that the resolved value is within the bounds of the min value and
  // the max value, using a combination of Math.min() and Math.max(). If it is
  // within the bounds, then return it. If it is less than the min value, then
  // return the min value. If it is greater than the max value, then return the
  // max value.
  return Math.min(Math.max(min, value), max);
}

// Helper function for resolving a callback. It can optionally take a fallback
// value as its second argument. It returns `undefined` if callback is null,
// otherwise it checks whether callback is a function. If it is a function, it
// returns it, otherwise it returns the fallback value provided or `undefined`.
function resolveCallback(callback, fallback) {
  return callback === null
    ? undefined
    : isFunction(callback)
    ? callback
    : fallback;
}

// Helper function for defining multiple non-configurable data properties on an
// object from a `properties` object of property-value pairs. This function
// leverages Object.defineProperties, hence it might throw errors when trying
// to redefine non-configurable properties that have been previously defined on
// the target object. The third argument can be used to specify the enumerable
// behavior of all the defined properties.
function exposeAsProperties(object, properties, enumerable = true) {
  // This ensures that enumerable is `false` only when it is explicitly passed
  // as `false`, otherwise it is `true`.
  enumerable = enumerable !== false;

  // Return the target object (now having the defined properties).
  return Object.defineProperties(
    object,

    // Object.keys together with Array.prototype.reduce is used here instead of
    // Object.fromEntries or Object.entries to eliminate the need of polyfills
    // for this run in ES5 browsers.
    Object.keys(properties).reduce((descriptors, prop) => {
      descriptors[prop] = {
        enumerable,
        value: properties[prop]
      };
      return descriptors;
    }, {})
  );
}

// Helper function that returns a promise that resolves after a specified delay
// in milliseconds. This delay is specified as the first argument. A callback
// can be provided as a second argument, that will be executed when the promise
// resolves. Since this function uses setTimeout for the delay, the callback is
// only executed if the timeout is still active (not yet cleared).
//
// The returned promise has an additional .end() method defined on it that can
// be used to clear the timeout even before the delay elapses. This method also
// returns a promise and can take a callback argument, that will be executed
// when the returned promise resolves.
function delay(ms, callback) {
  let timeout = 0;

  const promise = new Promise((resolve) => {
    // setTimeout is used to setup the delay.
    // Hence, a mechanism should be provided to clear timeout as needed.
    timeout = setTimeout(
      () => {
        resolve(
          // Create an immediately resolved promise and executes the passed
          // callback in its fulfillment handler as long as the timeout is
          // still active. Finally, the outer promise resolves with the
          // resulting promise.
          Promise.resolve().then(() => {
            if (timeout && isFunction(callback)) {
              return callback();
            }
          })
        );
      },

      // If ms cannot be resolved to a number, use 1000 milliseconds as timeout
      // delay instead.
      isNaN((ms = +ms)) || ms < 0 ? 1000 : ms
    );
  });

  // Expose a `.end` method (for clearing timeout) on the promise, before
  // returning the promise.
  return exposeAsProperties(promise, {
    // This .end() method ensures the timeout set by the delay is cleared and
    // reset. It can take a callback that will be executed as the fulfillment
    // handler of an already resolved promise before returning the promise.
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
  isInteger,
  isObject,
  resolveCallback
};
