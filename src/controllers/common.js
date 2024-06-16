'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.correlationHeader =
	exports.responseTime =
	exports.handleCompression =
	exports.handleBodyRequestParsing =
	exports.handleCors =
		void 0;
const cors_1 = __importDefault(require('cors'));
const body_parser_1 = __importDefault(require('body-parser'));
const compression_1 = __importDefault(require('compression'));
const Utils_1 = require('../utils/Utils');
const log = (0, Utils_1.getLogger)('Commons');
const correlationIdHeaderName = process.env.CORRELATION_ID_HEADER_NAME;
const handleCors = (router) => {
	log.trace('Adding cors() to router');
	router.use((0, cors_1.default)({ credentials: true, origin: true }));
};
exports.handleCors = handleCors;
const handleBodyRequestParsing = (router) => {
	log.trace('Adding parser.json()) to router');
	router.use(body_parser_1.default.urlencoded({ extended: true }));
	router.use(body_parser_1.default.json());
};
exports.handleBodyRequestParsing = handleBodyRequestParsing;
const handleCompression = (router) => {
	log.trace('Adding compression() to router');
	router.use((0, compression_1.default)());
};
exports.handleCompression = handleCompression;
const responseTime = (router) => {
	router.use((req, res, next) => {
		if (req.path === '/' || req.path === '/pulse') {
			return next();
		}
		let start = Date.now();
		log.trace('Request timestamp:: ', new Date(start));
		res.on('finish', function () {
			log.trace('Response timestamp:: ', new Date());
			let duration = Date.now() - start;
			log.debug('Turnaround time (response sent in): ', duration, 'ms');
		});
		next();
	});
};
exports.responseTime = responseTime;
const correlationHeader = (router) => {
	router.use((req, res, next) => {
		if (correlationIdHeaderName && req.get(correlationIdHeaderName)) {
			res.set(correlationIdHeaderName, req.get(correlationIdHeaderName));
		}
		next();
	});
};
exports.correlationHeader = correlationHeader;
//# sourceMappingURL=common.js.map
