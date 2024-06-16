import { NextFunction, Request, Response, Router } from 'express';
import { HTTP400Error, HTTP401Error } from '../utils/error4xx';
import { getLogger } from '../utils/Utils';
import { googleJwtValidator } from '../oidc/JwtValidator';
import { body, ValidationChain } from 'express-validator';

const log = getLogger('Validations');

export const validateKeyQueryParams = (req: Request, res: Response, next: NextFunction) => {
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

export const validateSetDataJson = (req: Request, res: Response, next: NextFunction) => {
	if (!req.body) {
		throw new HTTP400Error('Missing POST data');
	} else {
		const data = req.body;
		log.debug('Request body to validate: ', data);
		if (!data.key || (!data.value && data.value !== false)) {
			throw new HTTP400Error('"key" or "value" properties are missing in POST data');
		} else {
			next();
		}
	}
};


// export const validateAuth = (): ValidationChain => {
//
// 	body('token').custom(async (value, { req, location, path }) => {
// 		const isAuthenticated = await googleJwtValidator(value);
//
// 		if (!isAuthenticated) {
// 			throw new HTTP401Error();
// 		}
// 	})
// }
export const validateAuth2 = () => {

	return async (req: Request, res: Response, next: NextFunction) => {
		// router.use(async (req, res, next) => {
		const data: { token: string, clientId: string } = req.body as any;
		log.debug('token: ', data.token);
		const isAuthenticated = await googleJwtValidator(data.token);
		if (isAuthenticated) {
			next();
		}
		// res.sendStatus(isAuthenticated? 200: 401);
		throw new HTTP401Error();
		// });
	}
}
