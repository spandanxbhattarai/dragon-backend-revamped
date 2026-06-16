import { Router } from 'express';
import { eventsController } from './events.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createEventSchema, updateEventSchema, listEventsSchema } from './events.schema';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validate(listEventsSchema),
  eventsController.list as any,
);
router.get('/:id', optionalAuthenticate, eventsController.getById as any);
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createEventSchema),
  eventsController.create as any,
);
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateEventSchema),
  eventsController.update as any,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  eventsController.remove as any,
);

export default router;
