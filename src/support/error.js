const ABORT_ERROR = Object.freeze(__createAbortError__());
const TIMEOUT_ERROR = Object.freeze(__createError__('Timeout', 'TimeoutError'));

function __createError__(message, name) {
  const err = new Error(message);
  err.name = name;
  return err;
}

function __createAbortError__() {
  try {
    return new DOMException('Aborted', 'AbortError');
  } catch (e) {
    return __createError__('Aborted', 'AbortError');
  }
}

export { ABORT_ERROR, TIMEOUT_ERROR };
