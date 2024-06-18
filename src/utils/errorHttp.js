'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.HTTPClientError = void 0;
class HTTPClientError extends Error {
  constructor(message) {
    if (message instanceof Object) {
      super(JSON.stringify(message));
    } else {
      super(message);
    }
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
exports.HTTPClientError = HTTPClientError;
//# sourceMappingURL=errorHttp.js.map
