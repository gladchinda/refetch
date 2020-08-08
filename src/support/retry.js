import { isResponse } from './utils';
import { ABORT_ERROR, TIMEOUT_ERROR } from './error';

/**
 * A should-retry function that takes a `responseOrError` object
 * and returns `true` if the passed object is not a `Response`
 * object (meaning it is an error).
 *
 * The function is frozen for global and external usage in order
 * to prevent unwanted extensions.
 */
const ErrorRetry = Object.freeze(function __retryAfterAnyError__(
  responseOrError
) {
  return !isResponse(responseOrError);
});

/**
 * A should-retry function that takes a `responseOrError` object
 * and returns `true` if the passed object is not a `Response`
 * object (meaning it is an error), and is also neither the
 * `ABORT_ERROR` nor the `TIMEOUT_ERROR`.
 *
 * The function is frozen for global and external usage in order
 * to prevent unwanted extensions.
 */
const NetworkErrorRetry = Object.freeze(function __retryAfterNetworkError__(
  responseOrError
) {
  return !(
    isResponse(responseOrError) ||
    responseOrError === ABORT_ERROR ||
    responseOrError === TIMEOUT_ERROR
  );
});

/**
 * A should-retry function that takes a `responseOrError` object
 * and returns `true` if the passed object is the `TIMEOUT_ERROR`.
 *
 * The function is frozen for global and external usage in order
 * to prevent unwanted extensions.
 */
const TimeoutRetry = Object.freeze(function __retryAfterTimeout__(
  responseOrError
) {
  return responseOrError === TIMEOUT_ERROR;
});

export { ErrorRetry, NetworkErrorRetry, TimeoutRetry };
