import { StatusCodes } from 'http-status-codes';
import { CustomAPIError } from './custom-api.error.js';

export class BadRequestError extends CustomAPIError {
  constructor(message: any) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}