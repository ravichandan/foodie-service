'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.validateSetDataJson = exports.validateKeyQueryParams = void 0;
const error4xx_1 = require('../utils/error4xx');
const Utils_1 = require('../utils/Utils');
const log = (0, Utils_1.getLogger)('Validations');
const validateKeyQueryParams = (req, res, next) => {
  log.debug('in validateKeyQueryParams');
  // if (!req.query.key && !req.query.keys) {
  //     // TODO temp if block to be removed once payment service and payee service changes key from 'cache_key' to 'key'
  //     if (req.query.cache_key) {
  //         next();
  // } else {
  //     throw new HTTP400Error('Error! At least one of "key" or "keys" query params should be provided');
  // }
  // TODO temp code to be uncommented once payment service and payee service changes key from 'cache_key' to 'key'
  // throw new HTTP400Error('At least one of "key" and "keys" query params should be provided');
  // } else {
  next();
  // }
};
exports.validateKeyQueryParams = validateKeyQueryParams;
const validateSetDataJson = (req, res, next) => {
  if (!req.body) {
    throw new error4xx_1.HTTP400Error('Missing POST data');
  } else {
    const data = req.body;
    log.debug('Request body to validate: ', data);
    if (!data.key || (!data.value && data.value !== false)) {
      throw new error4xx_1.HTTP400Error('"key" or "value" properties are missing in POST data');
    } else {
      next();
    }
  }
};
exports.validateSetDataJson = validateSetDataJson;
//# sourceMappingURL=validators.js.map
