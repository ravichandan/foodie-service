import { NextFunction, Response } from 'express';
import { HTTP404Error } from './error4xx';
import { HTTPClientError } from './errorHttp';
import { getLogger } from './Utils';

const log = getLogger('ErrorHandler');

export const notFoundError = (err: Error, res: Response, next: NextFunction) => {
  log.error('NotFoundError handler', err);
  if (err instanceof HTTPClientError) {
    log.error('Error:', err);
    res.status(err.statusCode).send(err.message);
  } else {
    throw new HTTP404Error('Requested resource not found');
  }
};

export const clientError = (err: Error, res: Response, next: NextFunction) => {
  log.error('Client Error:', err);
  if (err instanceof HTTPClientError) {
    log.error('Error:', err);
    res.status(err.statusCode).send(err.message);
  } else {
    next(err);
  }
};

export const serverError = (err: Error, res: Response, next: NextFunction) => {
  log.error('Server Error:', err);
  log.trace('process.env.NODE_ENV==' + process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).send('Internal Server Error');
  } else {
    res.status(500).send(err.message + ' ' + err.stack);
  }
};

// export default [notFoundError, clientError, serverError, addN];
