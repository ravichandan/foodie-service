'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
// import { router } from '../routes/service.routes'
const http_1 = __importDefault(require('http'));
const utils_1 = require('../utils');
// import utils from './utils';
const controllers_1 = __importDefault(require('../controllers'));
const routes_1 = __importDefault(require('../routes'));
const error_handlers_1 = __importDefault(require('../controllers/error-handlers'));
const log4js_1 = require('log4js');
const logger = (0, log4js_1.getLogger)('server');
logger.level = process.env.LOG_LEVEL || 'info';
const socketTimeout = process.env.SOCKET_TIMEOUT;
// logger.debug("Some debug messages");
process.on('uncaughtException', (e) => {
  logger.error('uncaughtException: ', e);
  // process.exit(1);
});
process.on('unhandledRejection', (e) => {
  logger.error('unhandledRejection: ', e);
  // process.exit(1);
});
const router = (0, express_1.default)();
(0, utils_1.applyMiddleware)(controllers_1.default, router);
(0, utils_1.applyRoutes)(routes_1.default, router);
(0, utils_1.applyMiddleware)(error_handlers_1.default, router);
const { PORT = 3000 } = process.env;
const server = http_1.default.createServer(router).on('connection', function (socket) {
  if (!socket.errorFunctionTagged) {
    socket.on('error', function (exc) {
      logger.error('Exception in socket: ' + exc);
    });
  }
  socket.errorFunctionTagged = true;
});
const runningServer = server.listen(PORT, () => logger.info(`Server is running http://localhost:${PORT}`));
logger.trace('Before setting runningServer.keepAliveTimeout:: ', runningServer.keepAliveTimeout);
logger.trace('Before setting runningServer.headersTimeout:: ', runningServer.headersTimeout);
if (socketTimeout) {
  runningServer.keepAliveTimeout = +socketTimeout;
  runningServer.headersTimeout = runningServer.keepAliveTimeout + 10 * 1000;
}
logger.trace('After setting runningServer.keepAliveTimeout:: ', runningServer.keepAliveTimeout);
logger.trace('After setting runningServer.headersTimeout:: ', runningServer.headersTimeout);
//# sourceMappingURL=app.js.map
