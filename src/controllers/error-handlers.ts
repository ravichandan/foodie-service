import { Router, Request, Response, NextFunction } from 'express';
import * as ErrorHandler from '../utils/ErrorHandler';
import { getLogger } from '../utils/Utils';

const log = getLogger('ErrorHandlers');

const handle404Error = (router: Router) => {
	router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		log.error('Handling 404', err);
		ErrorHandler.notFoundError(err, res, next);
	});
};

const handleClientErrors = (router: Router) => {
	router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		log.error('Handling ClientError');
		ErrorHandler.clientError(err, res, next);
	});
};

const handleServerErrors = (router: Router) => {
	router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		log.error('Handling server error');
		ErrorHandler.serverError(err, res, next);
	});
};

export default [handleClientErrors, handleServerErrors];
