import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store';
import { findEarliestSlot } from './slotService';
import { Booking, VisaType, VisaTypeDef, ListBookingsFilters, WaitlistEntry } from '../types';

const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

function scheduleExpiry(booking: Booking) {
  setTimeout(() => {
    const b = store.bookings.find(x => x.id === booking.id);
    if (!b || b.status !== 'held') return;

    b.status = 'expired';
    console.log(`Booking ${b.id} expired — slot released`);

     processWaitlist(b.visaType, b.advisorId);
  }, HOLD_DURATION_MS);
}

//strech
function processWaitlist(visaType: VisaType, advisorId?: string) {
  const entry = store.waitlist.find(w => w.visaType === visaType);

  if (!entry) return;

  const slot = findEarliestSlot(visaType, advisorId);

  if (!slot) return;

  store.waitlist = store.waitlist.filter(w => w.id !== entry.id);

  const visaDef = VisaTypeDef[visaType];
  const now = new Date();

  const booking: Booking = {
    id: uuidv4(),
    advisorId: slot.advisorId,
    advisorName: slot.advisorName,
    candidateName: entry.candidateName,
    visaType,
    visaLabel: visaDef.label,
    durationMinutes: visaDef.durationMinutes,
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
    status: 'held',
    heldAt: now,
    heldUntil: new Date(now.getTime() + HOLD_DURATION_MS),
    createdAt: entry.addedAt,
  };

  store.bookings.push(booking);
  scheduleExpiry(booking);

  console.log(`Waitlist: slot offered to ${entry.candidateName}, booking ${booking.id} on hold`);
}

export function createBooking(candidateName: string, visaType: VisaType, advisorPreference?: string) {
  const slot = findEarliestSlot(visaType, advisorPreference);

  if (!slot) {
  const entry: WaitlistEntry = {
    id: uuidv4(),
    candidateName,
    visaType,
    addedAt: new Date(),
    advisorPreference,
  };

  store.waitlist.push(entry);

  return { type: 'waitlisted' as const, entry };
}

  const visaDef = VisaTypeDef[visaType];
  const now = new Date();
  const advisor = store.advisors.find(a => a.id === slot.advisorId)!;

  const booking: Booking = {
    id: uuidv4(),
    advisorId: slot.advisorId,
    advisorName: advisor.name,
    candidateName,
    visaType,
    visaLabel: visaDef.label,
    durationMinutes: visaDef.durationMinutes,
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
    status: 'held',
    heldAt: now,
    heldUntil: new Date(now.getTime() + HOLD_DURATION_MS),
    createdAt: now,
  };

  store.bookings.push(booking);
  scheduleExpiry(booking);

  return { type: 'booked' as const, booking };
}

export function confirmBooking(bookingId: string, advisorId: string) {
  const booking = store.bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return { success: false, reason: 'not_found' as const };
  }

  if (booking.advisorId !== advisorId) {
    return { success: false, reason: 'wrong_advisor' as const };
  }

  if (booking.status !== 'held') {
    return { success: false, reason: 'not_held' as const };
  }

  if (booking.heldUntil && new Date() > booking.heldUntil) {
    booking.status = 'expired';
    return { success: false, reason: 'expired' as const };
  }

  booking.status = 'confirmed';
  booking.confirmedAt = new Date();

  return { success: true as const, booking };
}

export function listBookings(filters: ListBookingsFilters) {
  let results = [...store.bookings];

  if (filters.status) {
    results = results.filter(b => b.status === filters.status);
  }

  if (filters.advisorId) {
    results = results.filter(b => b.advisorId === filters.advisorId);
  }

  if (filters.visaType) {
    results = results.filter(b => b.visaType === filters.visaType);
  }

  return results.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

//strech
export function cancelBooking(bookingId: string) {
  const booking = store.bookings.find(b => b.id === bookingId);

  if (!booking) {
    return { success: false, reason: 'not_found' as const };
  }

  if (booking.status === 'expired' || booking.status === 'cancelled') {
    return { success: false, reason: 'already_inactive' as const };
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();

  processWaitlist(booking.visaType, booking.advisorId);

  return { success: true as const, booking };
}