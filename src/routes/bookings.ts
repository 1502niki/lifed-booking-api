import { Router, Request, Response } from 'express';
import { createBooking, confirmBooking, listBookings, cancelBooking } from '../services/bookingService';
import { VisaType } from '../types';
import { store } from '../data/store';

const router = Router();

//create booking
router.post('/', (req: Request, res: Response) => {
  const { candidateName, visaType, advisorPreference } = req.body;

  if (!candidateName || typeof candidateName !== 'string' || !candidateName.trim()) {
    return res.status(400).json({ error: 'candidateName is required' });
  }

  if (!visaType || (visaType !== 'A' && visaType !== 'B')) {
    return res.status(400).json({ error: 'visaType must be A or B' });
  }

  const result = createBooking(candidateName.trim(), visaType as VisaType, advisorPreference);

  if (result.type === 'waitlisted') {
    return res.status(202).json({
      message: `No slots available. ${candidateName} has been added to the waitlist.`,
      waitlistEntry: result.entry,
    });
  }

  return res.status(201).json({
    message: `Slot held for ${candidateName}. Advisor has 10 minutes to confirm.`,
    booking: result.booking,
  });
});

//confirm booking
router.post('/:id/confirm', (req: Request, res: Response) => {
  const { advisorId } = req.body;
  const { id } = req.params;

  if (!advisorId) {
    return res.status(400).json({ error: 'advisorId is required' });
  }

  const result = confirmBooking(id as string, advisorId);

  if (!result.success) {
    const statusCodes = {
      not_found:     404,
      wrong_advisor: 403,
      not_held:      409,
      expired:       410,
    };

    return res
      .status(statusCodes[result.reason])
      .json({ error: result.reason });
  }

  return res.json({
    message: 'Booking confirmed',
    booking: result.booking,
  });
});

//list bookings with optional filters
router.get('/', (req: Request, res: Response) => {
  const { status, advisorId, visaType} = req.query;

  const validStatuses = ['held', 'confirmed', 'cancelled', 'expired'];
  if (status && !validStatuses.includes(status as string)) {
    return res.status(400).json({
      error: `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
    });
  }

  const bookings = listBookings({
    status: status as string | undefined,
    advisorId: advisorId as string | undefined,
    visaType: visaType as string | undefined,
  });

  return res.json({
    total: bookings.length,
    bookings,
  });
});

//get booking by id
router.get('/:id', (req: Request, res: Response) => {
  const booking = store.bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  return res.json(booking);
});

//strech - cancel booking
router.post('/:id/cancel', (req: Request, res: Response) => {
  const result = cancelBooking(req.params.id as string);

  if (!result.success) {
    const statusCodes = {
      not_found:       404,
      already_inactive: 409,
    };

    return res
      .status(statusCodes[result.reason])
      .json({ error: result.reason });
  }

  return res.json({
    message: 'Booking cancelled',
    booking: result.booking,
  });
});

export default router;