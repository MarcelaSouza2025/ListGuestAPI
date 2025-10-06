import { Router } from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/role.js';
import { createEvent, listEvents, getEvent, updateEvent, deleteEvent } from '../controllers/event.controller.js';
const router = Router();
router.post('/', authRequired, isAdmin, [
    body('title').notEmpty(),
    body('artist').notEmpty(),
    body('date').isISO8601(),
    body('location').notEmpty()
], createEvent);
router.get('/', authRequired, listEvents);
router.get('/:id', authRequired, getEvent);
router.put('/:id', authRequired, isAdmin, [
    body('title').optional().notEmpty(),
    body('artist').optional().notEmpty(),
    body('date').optional().isISO8601(),
    body('location').optional().notEmpty()
], updateEvent);
router.delete('/:id', authRequired, isAdmin, deleteEvent);
export default router;
