import { StatusCodes } from 'http-status-codes';
import { CustomAPIError } from './custom-api.error.js';

export class InternalServerError extends CustomAPIError {
    constructor(message: any) {
        super(message);
        this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }
}