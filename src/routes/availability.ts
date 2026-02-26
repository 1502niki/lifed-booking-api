import { Router, Request, Response } from 'express';
import { getAvailableSlots } from '../services/slotService';
import { VisaType } from '../types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { visaType, advisorId } = req.query;
  console.log('Received availability request with query:', req.query);

  if (!visaType || (visaType !== 'A' && visaType !== 'B')) {
    return res.status(400).json({
      error: 'visaType must be A or B',
    });
  }

  const slots = getAvailableSlots(visaType as VisaType, advisorId as string | undefined);

  return res.json({
    total: slots.length,
    slots,
  });
});

export default router;