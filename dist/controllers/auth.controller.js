import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { comparePassword, hashPassword, randomToken, sha256 } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../utils/jwt.js';
import { sendEmail } from '../utils/sendEmail.js';
export async function register(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { name, email, password, passwordConfirm } = req.body;
        if (password !== passwordConfirm)
            return res.status(400).json({ message: 'Password confirmation does not match' });
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json({ message: 'Email already registered' });
        const hash = await hashPassword(password);
        const user = await prisma.user.create({ data: { name, email, password: hash, role: 'user' } });
        return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    }
    catch (e) {
        return res.status(500).json({ message: 'Register error', error: e.message });
    }
}
export async function registerAdmin(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { name, email, password, passwordConfirm, adminSecret } = req.body;
        if (password !== passwordConfirm)
            return res.status(400).json({ message: 'Password confirmation does not match' });
        if (adminSecret !== process.env.ADMIN_SECRET)
            return res.status(403).json({ message: 'Invalid admin secret' });
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json({ message: 'Email already registered' });
        const hash = await hashPassword(password);
        const user = await prisma.user.create({ data: { name, email, password: hash, role: 'admin' } });
        return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    }
    catch (e) {
        return res.status(500).json({ message: 'Register admin error', error: e.message });
    }
}
export async function login(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await comparePassword(password, user.password);
        if (!ok)
            return res.status(401).json({ message: 'Invalid credentials' });
        const accessToken = signAccessToken({ id: user.id, role: user.role });
        const refreshTokenRaw = signRefreshToken({ id: user.id, role: user.role });
        // calcula expiresAt decodificando o próprio refresh JWT
        const decoded = jwt.decode(refreshTokenRaw);
        const expiresAt = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30d
        await prisma.refreshToken.create({
            data: {
                tokenHash: sha256(refreshTokenRaw),
                userId: user.id,
                expiresAt,
                ip: req.ip,
                userAgent: req.headers['user-agent'] || undefined
            }
        });
        return res.json({
            accessToken,
            refreshToken: refreshTokenRaw,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (e) {
        return res.status(500).json({ message: 'Login error', error: e.message });
    }
}
export async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: 'Missing refreshToken' });
        const payload = verifyRefresh(refreshToken);
        const tokenHash = sha256(refreshToken);
        const record = await prisma.refreshToken.findFirst({
            where: { tokenHash, userId: payload.id, revokedAt: null, expiresAt: { gt: new Date() } },
            include: { user: true }
        });
        if (!record || !record.user)
            return res.status(401).json({ message: 'Invalid refresh token' });
        const accessToken = signAccessToken({ id: record.user.id, role: record.user.role });
        return res.json({ accessToken });
    }
    catch (e) {
        return res.status(401).json({ message: 'Invalid refresh token', error: e.message });
    }
}
export async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.json({ message: 'Logged out' });
        const tokenHash = sha256(refreshToken);
        await prisma.refreshToken.updateMany({
            where: { tokenHash },
            data: { revokedAt: new Date() }
        });
        return res.json({ message: 'Logged out' });
    }
    catch (e) {
        return res.status(500).json({ message: 'Logout error', error: e.message });
    }
}
export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.json({ message: 'If the email exists, a reset link was sent' });
        const raw = randomToken(32);
        const tokenHash = sha256(raw);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await prisma.passwordResetToken.create({
            data: { tokenHash, userId: user.id, expiresAt }
        });
        const base = process.env.APP_BASE_URL || 'http://localhost:4000';
        const resetURL = `${base}/api/auth/reset-password/${raw}`;
        await sendEmail({
            to: user.email,
            subject: 'Password reset',
            html: `<p>Click to reset your password:</p><p><a href="${resetURL}">${resetURL}</a></p><p>This link expires in 30 minutes.</p>`
        });
        return res.json({ message: 'Reset link sent if email is registered' });
    }
    catch (e) {
        return res.status(500).json({ message: 'Forgot password error', error: e.message });
    }
}
export async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password, passwordConfirm } = req.body;
        if (password !== passwordConfirm)
            return res.status(400).json({ message: 'Password confirmation does not match' });
        const tokenHash = sha256(token);
        const record = await prisma.passwordResetToken.findFirst({
            where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
            include: { user: true }
        });
        if (!record || !record.user)
            return res.status(400).json({ message: 'Invalid or expired token' });
        const newHash = await hashPassword(password);
        await prisma.$transaction([
            prisma.user.update({ where: { id: record.userId }, data: { password: newHash } }),
            prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
            prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })
        ]);
        return res.json({ message: 'Password updated successfully' });
    }
    catch (e) {
        return res.status(500).json({ message: 'Reset password error', error: e.message });
    }
}
