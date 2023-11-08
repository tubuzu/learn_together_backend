import { StatusCodes } from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response) => {
  return res.status(404).send(`Not Found - ${req.originalUrl}`);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, please try again later!'
  }

  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors).map((item: any) => item.message).join(',')
    customError.statusCode = 400
  }
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please enter another value`
    customError.statusCode = 400
  }
  if (err.name === 'CastError') {
    customError.msg = `No item found with id: ${err.value}`
    customError.statusCode = 404
  }
  console.log(err);

  return res.status(customError.statusCode).json({ msg: customError.msg })
};