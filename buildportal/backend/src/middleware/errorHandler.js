export function errorHandler(err, req, res, next) {
  console.error('❌', err.message);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}