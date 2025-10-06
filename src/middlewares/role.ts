import { Request, Response, NextFunction } from 'express';
import { AuthedRequest } from './auth.js';

export function isAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Admins only' });
}

export function userCanOnlyUpdateGuestStatus(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') return next();
  const allowed = ['status'];
  const keys = Object.keys(req.body || {});
  const invalid = keys.filter(k => !allowed.includes(k));
  if (invalid.length) return res.status(403).json({ message: 'Users can only update "status"' });
  next();
}
