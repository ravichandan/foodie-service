'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getJson = exports.applyRoutes = exports.applyMiddleware = exports.getLogger = void 0;
const log4js_1 = require('log4js');
const getLogger = (name) => {
  let logger = (0, log4js_1.getLogger)(name);
  logger.level = process.env.LOG_LEVEL || 'info';
  return logger;
};
exports.getLogger = getLogger;
const logger = (0, exports.getLogger)('Utils');
logger.level = process.env.LOG_LEVEL || 'info';
const applyMiddleware = (middleware, router) => {
  for (const f of middleware) {
    logger.debug('In applyMiddleware, f = ' + f);
    f(router);
  }
};
exports.applyMiddleware = applyMiddleware;
const applyRoutes = (routes, router) => {
  for (const route of routes) {
    const { method, path, handler } = route;
    logger.debug('In applyRoutes, router = ' + router);
    router[method](path, handler);
  }
};
exports.applyRoutes = applyRoutes;
const getJson = (item) => {
  logger.trace('Got item: ', item);
  if (!item) {
    logger.trace('Item is not available, returning undefined');
    return undefined;
  }
  if (typeof item === 'object') {
    logger.trace('typeof item is object, returning as-is');
    return item;
  }
  try {
    if (typeof item !== 'string') {
      logger.trace('Item is not of string type. Stringifying item now');
      item = JSON.stringify(item);
    }
    logger.trace('Parsing item');
    item = JSON.parse(item);
  } catch (e) {
    logger.trace('Error while stringifying or parsing item. Item not JSON format: ' + item);
    return undefined;
  }
  logger.trace('typeof object after parsing: ', typeof item);
  if (typeof item === 'object' && item !== null) {
    return item;
  }
  return undefined;
};
exports.getJson = getJson;
//# sourceMappingURL=Utils.js.map
