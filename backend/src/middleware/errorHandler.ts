import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error');
  res.status(500).json({ success: false, message: 'Internal Server Error' });
};
