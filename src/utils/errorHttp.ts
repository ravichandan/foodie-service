export abstract class HTTPClientError /*extends Error*/ {
  readonly statusCode!: number;
  readonly name!: string;
  readonly message!: string;

  protected constructor(message: string) {
    // super(JSON.stringify(message));
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}
