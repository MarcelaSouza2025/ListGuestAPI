import { Router } from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middlewares/auth.js';
import { createGuest, listGuests, getGuest, updateGuest, deleteGuest } from '../controllers/guest.controller.js';
import { isAdmin, userCanOnlyUpdateGuestStatus } from '../middlewares/role.js';

const router = Router({ mergeParams: true });

router.post('/', authRequired, isAdmin, [
  body('name').notEmpty(),
  body('birthdate').isISO8601(),
  body('document').notEmpty(),
  body('status').optional().isIn(['pending', 'present', 'absent'])
], createGuest);

router.get('/', authRequired, listGuests);
router.get('/:id', authRequired, getGuest);

router.put('/:id', authRequired, userCanOnlyUpdateGuestStatus, [
  body('status').optional().isIn(['pending', 'present', 'absent']),
  body('name').optional().notEmpty(),
  body('birthdate').optional().isISO8601(),
  body('document').optional().notEmpty()
], updateGuest);

router.delete('/:id', authRequired, isAdmin, deleteGuest);

export default router;
