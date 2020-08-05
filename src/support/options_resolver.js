import { isPlainObject } from './utils';

function initOptionsResolver(option, defaultValue) {
  return function __resolver__(init) {
    isPlainObject(init) && (init[option] = init[option] || defaultValue);
  };
}

function initHeadersResolver(headers) {
  return function __resolver__(init) {
    if (isPlainObject(init)) {
      let $headers = init['headers'];

      if ($headers instanceof Headers) {
        init['headers'] = Object.keys(headers).reduce((HEADERS, header) => {
          !HEADERS.has(header) && HEADERS.set(header, headers[header]);
          return HEADERS;
        }, $headers);
      } else {
        $headers = isPlainObject($headers) ? $headers : {};
        init['headers'] = { ...headers, ...$headers };
      }
    }
  };
}

export { initHeadersResolver, initOptionsResolver };
