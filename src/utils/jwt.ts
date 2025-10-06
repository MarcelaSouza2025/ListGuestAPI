import jwt, { SignOptions, Secret } from 'jsonwebtoken';

type JwtPayload = { id: string; role: 'user' | 'admin' };

const accessSecret: Secret = process.env.JWT_ACCESS_SECRET as Secret;
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET as Secret;

export function signAccessToken(payload: JwtPayload) {
  const exp = (process.env.JWT_ACCESS_EXPIRES ?? '15m') as unknown as SignOptions['expiresIn'];
  return jwt.sign(payload, accessSecret, { expiresIn: exp });
}

export function signRefreshToken(payload: JwtPayload) {
  const exp = (process.env.JWT_REFRESH_EXPIRES ?? '30d') as unknown as SignOptions['expiresIn'];
  return jwt.sign(payload, refreshSecret, { expiresIn: exp });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload;
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, refreshSecret) as JwtPayload;
}
