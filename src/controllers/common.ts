import { Router } from 'express';
import cors from 'cors';
import parser from 'body-parser';
import compression from 'compression';
import { getLogger } from '../utils/Utils';
import { googleJwtValidator } from '../oidc/JwtValidator';

const log = getLogger('Commons');
const correlationIdHeaderName = process.env.CORRELATION_ID_HEADER_NAME;

export const handleCors = (router: Router) => {
	log.trace('Adding cors() to router');
	router.use(cors({ credentials: true, origin: true }));
};

export const handleBodyRequestParsing = (router: Router) => {
	log.trace('Adding parser.json()) to router');
	router.use(parser.urlencoded({ extended: true }));
	router.use(parser.json());
};

export const handleCompression = (router: Router) => {
	log.trace('Adding compression() to router');
	router.use(compression());
};

export const responseTime = (router: Router) => {
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

export const correlationHeader = (router: Router) => {
	router.use((req, res, next) => {
		if (correlationIdHeaderName && req.get(correlationIdHeaderName)) {
			res.set(correlationIdHeaderName, req.get(correlationIdHeaderName));
		}
		next();
	});
};
