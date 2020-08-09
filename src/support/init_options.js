import { noop, isPlainObject, isEmptyObject } from './utils';
import { FETCH_INIT_OPTIONS } from './constants';

/**
 * A higher order function that returns the resolver function for
 * the key specified as `option` in the fetch initialization options
 * object. If the key is not found, it is set to the `defaultValue`.
 *
 * The returned resolver function takes an initialization options
 * object and sets the value of the key specified as `option` to the
 * specified `defaultValue`, provided the specified key does not exist.
 * If the key specified as `option` however exists, nothing changes.
 *
 * If the value specified as `option` is `"headers"` or not one of the
 * options in the `FETCH_INIT_OPTIONS` list, it is ignored, and the
 * returned resolver function does nothing.
 *
 * @param {*} option The fetch initialization option.
 * @param {*} defaultValue The default value for the specified `option`.
 * @returns {function} The resolver function for the specified `option`.
 * @see FETCH_INIT_OPTIONS
 */
function initOptionResolver(option, defaultValue) {
  // Check if the specified `option` is one of the allowed fetch options,
  // and that its value is not `"headers"`.
  const isAllowedFetchOption =
    FETCH_INIT_OPTIONS.indexOf(option) >= 0 && option !== 'headers';

  // Check if the function was called with a `defaultValue` argument.
  const withDefaultValue = arguments.length > 1;

  // Return the resolver function if the specified `option` is allowed,
  // and if a `defaultValue` was provided. Otherwise, return a no-op
  // function that will do nothing.
  return isAllowedFetchOption && withDefaultValue
    ? function __resolver__(init) {
        // Only assign `defaultValue` to the key specified as `option` if
        // it does not already exist in the initialization options object.
        if (isPlainObject(init) && !Object.hasOwnProperty(init, option)) {
          init[option] = defaultValue;
        }
      }
    : noop;
}

/**
 * A higher order function that returns the resolver function for the
 * `"headers"` property in the fetch initialization options object.
 *
 * The returned resolver function takes an initialization options
 * object and updates its `"headers"` property to reflect headers
 * specified in the `headers` argument, as long as they don't already
 * exist, hence preventing overwriting of header values.
 *
 * The returned resolver function, when called, might also result in
 * replacing the value of the fetch intialization options object's
 * `"headers"` property with the corresponding `Headers` object.
 *
 * @param {*} headers The supposed headers passed as a plain object literal
 *                    or an a `Headers` object.
 * @returns {function} The resolver function for the `"headers"` option.
 */
function initHeadersResolver(headers) {
  // If `headers` is a non-empty plain object, make a new `Headers` object
  // out of it.
  if (isPlainObject(headers) && !isEmptyObject(headers)) {
    headers = new Headers(headers);
  }

  // Return the resolver function if `headers` is a `Headers` object.
  // Otherwise, return a no-op function that will do nothing.
  return headers instanceof Headers
    ? function __resolver__(init) {
        if (isPlainObject(init)) {
          let $headers = init['headers'];

          // Make a new `Headers` object out of the init `$headers`.
          $headers = new Headers(isPlainObject($headers) ? $headers : {});

          if ($headers instanceof Headers) {
            // For every header in the `headers` object that isn't already
            // in `$headers` object, set it on the `$headers` object.
            headers.forEach((value, header) => {
              try {
                if (!$headers.has(header)) {
                  $headers.set(header, value);
                }
              } catch (e) {
                // Silence errors that might be throw as a result of setting
                // headers that are not allowed.
              }
            });

            // Replace `"headers"` in the fetch initialization options object
            // with the updated `$headers` `Headers` object. This ensures that
            // the `headers` field will always be a `Headers` object whenever
            // it set, even if it was initially a plain object.
            init['headers'] = $headers;
          }
        }
      }
    : noop;
}

export { initHeadersResolver, initOptionResolver };
