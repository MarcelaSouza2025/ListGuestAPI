import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';

export interface AuthedRequest extends Request {
  user?: { id: string; role: 'user' | 'admin' };
}

export async function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = verifyAccess(token);
    // opcional: garantir que usuário existe
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, role: true, email: true, name: true } });
    if (!user) return res.status(401).json({ message: 'Invalid token user' });

    req.user = { id: user.id, role: user.role };
    next();
  } catch (e: any) {
    return res.status(401).json({ message: 'Unauthorized', error: e.message });
  }
}
