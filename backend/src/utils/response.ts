import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: unknown) => {
  res.status(statusCode).json({ success: false, message, errors });
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully') => {
  sendSuccess(res, data, message, 201);
};
