'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.serverError = exports.clientError = exports.notFoundError = void 0;
const error4xx_1 = require('./error4xx');
const errorHttp_1 = require('./errorHttp');
const Utils_1 = require('./Utils');
const log = (0, Utils_1.getLogger)('ErrorHandler');
const notFoundError = (err, res, next) => {
	log.error('NotFoundError handler', err);
	if (err instanceof errorHttp_1.HTTPClientError) {
		log.error('Error:', err);
		res.status(err.statusCode).send(err.message);
	} else {
		throw new error4xx_1.HTTP404Error('Method not found');
	}
};
exports.notFoundError = notFoundError;
const clientError = (err, res, next) => {
	log.error('Client Error:', err);
	if (err instanceof errorHttp_1.HTTPClientError) {
		log.error('Error:', err);
		res.status(err.statusCode).send(err.message);
	} else {
		next(err);
	}
};
exports.clientError = clientError;
const serverError = (err, res, next) => {
	log.error('Server Error:', err);
	log.trace('process.env.NODE_ENV==' + process.env.NODE_ENV);
	if (process.env.NODE_ENV === 'production') {
		res.status(500).send('Internal Server Error');
	} else {
		res.status(500).send(err.message + ' ' + err.stack);
	}
};
exports.serverError = serverError;
// export default [notFoundError, clientError, serverError, addN];
//# sourceMappingURL=ErrorHandler.js.map
