import { StatusCodes } from 'http-status-codes';
import { CustomAPIError } from './custom-api.error.js';

export class NotFoundError extends CustomAPIError {
  constructor(message: any) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}