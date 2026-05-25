import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new AppError('Authentication required', 401);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError('User not found', 401);
  req.user = user;
  next();
}