import { StatusCodes } from "http-status-codes";

export class CustomAPIError extends Error {
  statusCode: StatusCodes | undefined;
  success: boolean;
  constructor(message: any) {
    super(message);
    this.success = false;
  }
}
