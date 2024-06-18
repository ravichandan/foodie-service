'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.HTTP404Error = exports.HTTP400Error = void 0;
const errorHttp_1 = require('./errorHttp');
class HTTP400Error extends errorHttp_1.HTTPClientError {
  constructor(message = 'Bad request') {
    super(message);
    this.statusCode = 400;
  }
}
exports.HTTP400Error = HTTP400Error;
class HTTP404Error extends errorHttp_1.HTTPClientError {
  constructor(message = 'Not found') {
    super(message);
    this.statusCode = 404;
  }
}
exports.HTTP404Error = HTTP404Error;
//# sourceMappingURL=error4xx.js.map
