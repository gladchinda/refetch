/**
 * An AbortError instance object, which could either be a
 * `DOMException` or an `Error` instance, created using the
 * `__createAbortError__()` helper. The error object is frozen
 * for global usage in order to prevent unwanted extensions.
 */
const ABORT_ERROR = Object.freeze(__createAbortError__());

/**
 * An TimeoutError instance object created using the `__createError__()`
 * helper. The error object is frozen for global usage in order to
 * prevent unwanted extensions.
 */
const TIMEOUT_ERROR = Object.freeze(__createError__('Timeout', 'TimeoutError'));

/**
 * Create an `Error` instance object with the given message and name.
 * @param {string} message The message of the created error instance
 * @param {string} name The name property of the created error instance
 * @returns {Error} The created error instance
 */
function __createError__(message, name) {
  const err = new Error(message);
  err.name = name;
  return err;
}

/**
 * Creates a `DOMException` for an abort error. If the `DOMException`
 * constructor is not available, it resorts to creating the abort error
 * using the `Error` constructor instead.
 * @returns {(DOMException|Error)} The created abort error instance
 * @see __createError__
 */
function __createAbortError__() {
  try {
    return new DOMException('Aborted', 'AbortError');
  } catch (e) {
    return __createError__('Aborted', 'AbortError');
  }
}

export { ABORT_ERROR, TIMEOUT_ERROR };
