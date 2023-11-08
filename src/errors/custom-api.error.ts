import { StatusCodes } from "http-status-codes";

export class CustomAPIError extends Error {
  statusCode: StatusCodes | undefined;
  constructor(message: any) {
    super(message)
  }
}