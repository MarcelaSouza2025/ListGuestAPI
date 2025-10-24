import { Router } from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middlewares/auth.js';
import { createGuest, listGuests, getGuest, updateGuest, deleteGuest } from '../controllers/guest.controller.js';
import { isAdmin, userCanOnlyUpdateGuestStatus } from '../middlewares/role.js';

const router = Router({ mergeParams: true });

/**
 * CREATE: somente "name" obrigatório; demais campos opcionais
 * (rota já protegida por isAdmin)
 */
router.post(
  '/',
  authRequired,
  isAdmin,
  [
    body('name').isString().trim().notEmpty().withMessage('name is required'),
    body('birthdate').optional({ nullable: true }).isISO8601().withMessage('invalid birthdate'),
    body('document').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['pending', 'present', 'absent'])
  ],
  createGuest
);

router.get('/', authRequired, listGuests);
router.get('/:id', authRequired, getGuest);

/**
 * UPDATE:
 * - user comum: middleware userCanOnlyUpdateGuestStatus já bloqueia outros campos
 * - admin: "name" passa a ser obrigatório (se admin estiver editando)
 *   -> validação condicional abaixo
 */
router.put(
  '/:id',
  authRequired,
  userCanOnlyUpdateGuestStatus,
  [
    body('status').optional().isIn(['pending', 'present', 'absent']),
    // name é obrigatório SOMENTE para admin
    body('name').custom((val, { req }) => {
      const isAdminUser = req.user?.role === 'admin';
      if (isAdminUser) {
        if (val === undefined || String(val).trim() === '') {
          throw new Error('name is required for admin updates');
        }
      }
      // se não for admin, o middleware já impede enviar "name"
      return true;
    }),
    body('birthdate').optional({ nullable: true }).isISO8601().withMessage('invalid birthdate'),
    body('document').optional({ nullable: true }).isString()
  ],
  updateGuest
);

router.delete('/:id', authRequired, isAdmin, deleteGuest);

export default router;
