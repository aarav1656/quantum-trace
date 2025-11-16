import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import { logger } from '../utils/logger';
import config from '../config/config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number): CustomError => {
  return new CustomError(message, statusCode);
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let details: any = undefined;

  // Handle specific error types
  if (error instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    details = error.details.map(detail => ({
      field: detail.path?.join('.'),
      message: detail.message,
    }));
  }

  // Handle database errors
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Handle Redis errors
  if (error.message.includes('Redis')) {
    statusCode = 503;
    message = 'Cache service temporarily unavailable';
  }

  // Handle IOTA errors
  if (error.message.includes('IOTA') || error.message.includes('Node')) {
    statusCode = 503;
    message = 'Blockchain service temporarily unavailable';
  }

  // Log error
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else {
    logger.warn('Client Error:', errorLog);
  }

  // Send error response
  const response: any = {
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  // Include request ID if available
  const requestId = req.headers['x-request-id'];
  if (requestId) {
    response.error.requestId = requestId;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  });
};

export default errorHandler;