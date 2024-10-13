import express from 'express';
import { db } from '../config/db.config';
// import { router } from '../routes/service.routes'

import http from 'http';
import { applyMiddleware, applyRoutes } from '../utils';
// import utils from './utils';
import controllers from '../controllers';
import routes from '../routes';
import errorHandlers from '../controllers/error-handlers';
import { getLogger } from 'log4js';

const logger = getLogger('server');
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

const router = express();
router.use(express.urlencoded({extended: false}));
router.use(express.json());

applyMiddleware(controllers, router);
applyRoutes(routes, router);
applyMiddleware(errorHandlers, router);

// router.us
const { PORT = 3000 } = process.env;
const server = http.createServer(router).on('connection', function (socket: any) {
  if (!socket.errorFunctionTagged) {
    socket.on('error', function (exc: any) {
      logger.error('Exception in socket: ' + exc);
    });
  }
  socket.errorFunctionTagged = true;
});

//db connection then server connection
db.then(() => {
  const runningServer = server.listen(PORT, () => logger.info(`Server is running http://localhost:${PORT}`));

  console.log('Before setting runningServer.keepAliveTimeout:: ', runningServer.keepAliveTimeout);
  logger.trace('Before setting runningServer.keepAliveTimeout:: ', runningServer.keepAliveTimeout);
  logger.trace('Before setting runningServer.headersTimeout:: ', runningServer.headersTimeout);

  if (socketTimeout) {
    runningServer.keepAliveTimeout = +socketTimeout;
    runningServer.headersTimeout = runningServer.keepAliveTimeout + 10 * 1000;
  }

  logger.trace('After setting runningServer.keepAliveTimeout:: ', runningServer.keepAliveTimeout);
  logger.trace('After setting runningServer.headersTimeout:: ', runningServer.headersTimeout);
});

module.exports = router;
