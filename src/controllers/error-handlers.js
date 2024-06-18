'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
const ErrorHandler = __importStar(require('../utils/ErrorHandler'));
const Utils_1 = require('../utils/Utils');
const log = (0, Utils_1.getLogger)('ErrorHandlers');
const handle404Error = (router) => {
  router.use((err, req, res, next) => {
    log.error('Handling 404', err);
    ErrorHandler.notFoundError(err, res, next);
  });
};
const handleClientErrors = (router) => {
  router.use((err, req, res, next) => {
    log.error('Handling ClientError');
    ErrorHandler.clientError(err, res, next);
  });
};
const handleServerErrors = (router) => {
  router.use((err, req, res, next) => {
    log.error('Handling server error');
    ErrorHandler.serverError(err, res, next);
  });
};
exports.default = [handleClientErrors, handleServerErrors];
//# sourceMappingURL=error-handlers.js.map
