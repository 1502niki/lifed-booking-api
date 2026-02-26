import { Booking, WaitlistEntry } from '../types';
import { seedData } from './seed';

export const store = {
  advisors: seedData.advisors,
  bookings: [] as Booking[],
  waitlist: [] as WaitlistEntry[],
  lastAssignedAdvisorIndex: 0,
};