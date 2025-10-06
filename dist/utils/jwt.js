import jwt from 'jsonwebtoken';
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
export function signAccessToken(payload) {
    const exp = (process.env.JWT_ACCESS_EXPIRES ?? '15m');
    return jwt.sign(payload, accessSecret, { expiresIn: exp });
}
export function signRefreshToken(payload) {
    const exp = (process.env.JWT_REFRESH_EXPIRES ?? '30d');
    return jwt.sign(payload, refreshSecret, { expiresIn: exp });
}
export function verifyAccess(token) {
    return jwt.verify(token, accessSecret);
}
export function verifyRefresh(token) {
    return jwt.verify(token, refreshSecret);
}
