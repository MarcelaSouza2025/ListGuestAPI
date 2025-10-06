import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function hashPassword(raw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(raw, salt);
}

export function comparePassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}

export function sha256(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function randomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}
