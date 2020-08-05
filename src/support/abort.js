import { isSignal } from './utils';
import { ABORT_ERROR } from './error';
import { PENDING_PROMISE } from './promise';

function createAbortController() {
  const controller = new AbortController();
  const { signal } = controller;
  return { signal, abort: controller.abort.bind(controller) };
}

function createAbortPromise(signal) {
  return isSignal(signal) && !signal.aborted
    ? new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(ABORT_ERROR));
      })
    : PENDING_PROMISE;
}

export { createAbortController, createAbortPromise };
