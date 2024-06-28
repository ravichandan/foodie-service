import { HTTPClientError } from './errorHttp';

export class HTTP400Error extends HTTPClientError {
  readonly statusCode = 400;

  constructor(message: string = 'Bad request') {
    super(message);
  }
}

export class CustomerIdHeaderNotFoundError extends HTTP400Error {
  constructor(message?: string) {
    super(message ?? 'CUSTOMER_ID header has to be provided ');
  }
}
export class HTTP404Error extends HTTPClientError {
  readonly statusCode = 404;

  constructor(message: string = 'Not found') {
    super(message);
  }
}

export class HTTP401Error extends HTTPClientError {
  readonly statusCode = 401;

  constructor(message: string = 'User not authorised to perform this action') {
    super(message);
  }
}
