import { Router } from 'express';
import { body } from 'express-validator';
import { register, registerAdmin, login, refresh, logout, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
const router = Router();
router.post('/register', [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('passwordConfirm').notEmpty()
], register);
router.post('/register-admin', [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('passwordConfirm').notEmpty(),
    body('adminSecret').notEmpty()
], registerAdmin);
router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty()
], login);
router.post('/refresh', [
    body('refreshToken').notEmpty()
], refresh);
router.post('/logout', logout);
router.post('/forgot-password', [body('email').isEmail()], forgotPassword);
router.post('/reset-password/:token', [
    body('password').isLength({ min: 6 }),
    body('passwordConfirm').notEmpty()
], resetPassword);
export default router;
