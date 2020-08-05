function constant(value) {
  return function __constant__() {
    return value;
  };
}

function createError(message, name) {
  const err = new Error(message);
  err.name = name;
  return err;
}

function createAbortError() {
  try {
    return new DOMException('Aborted', 'AbortError');
  } catch (e) {
    return createError('Aborted', 'AbortError');
  }
}

export { constant, createAbortError, createError };
