import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode ? error.statusCode : 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], false);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
  };

  // Mask internal server errors in production
  if (env.NODE_ENV === 'production' && !error.isOperational) {
    response.message = 'Internal Server Error';
    delete response.errors;
  }

  res.status(error.statusCode).json(response);
};
