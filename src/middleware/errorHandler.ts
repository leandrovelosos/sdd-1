import { Request, Response, NextFunction } from 'express'
import { ValidationError, NotFoundError, ConflictError } from '../types'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.details,
    })
    return
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: 'User not found',
      message: err.message,
    })
    return
  }

  if (err instanceof ConflictError) {
    res.status(409).json({
      error: 'Email already exists',
      message: err.message,
    })
    return
  }

  console.error('Unexpected error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  })
}
