import { store } from '../data/store';
import { AvailableSlot, VisaType, VisaTypeDef } from '../types';

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function getAvailableSlots(visaType: VisaType, advisorId?: string): AvailableSlot[] {
  const visaDef = VisaTypeDef[visaType];
  const slots: AvailableSlot[] = [];

  //strech: if advisorId is provided then only check for that advisors availability
  const advisorsToCheck = advisorId
    ? store.advisors.filter(a => a.id === advisorId)
    : store.advisors;

  for (const advisor of advisorsToCheck) {

    const activeBookings = store.bookings.filter(
      b => b.advisorId === advisor.id && (b.status === 'held' || b.status === 'confirmed')
    );

    for (const window of advisor.availability) {
      const windowStart = new Date(window.start);
      const windowEnd = new Date(window.end);

      let slotStart = windowStart;

      while (addMinutes(slotStart, visaDef.durationMinutes) <= windowEnd) {
        const slotEnd = addMinutes(slotStart, visaDef.durationMinutes);

        const blockedSlots = activeBookings.find(b => {
        const slotOverlapsBooking = slotStart < b.endTime && slotEnd > b.startTime;

        if (b.status === 'held') {
          return slotOverlapsBooking;  
        }

        //strech
        const breakBuffer = VisaTypeDef[b.visaType].breakAfterMinutes;
        const breakEnd = addMinutes(b.endTime, breakBuffer);
        const slotIsInBreakPeriod = slotStart >= b.endTime && slotStart < breakEnd;

        return slotOverlapsBooking || slotIsInBreakPeriod;
      });


        if (blockedSlots) {
          if (blockedSlots.status === 'confirmed') {
            const breakBuffer = VisaTypeDef[blockedSlots.visaType].breakAfterMinutes;
            slotStart = addMinutes(blockedSlots.endTime, breakBuffer);
          } else {
            slotStart = new Date(blockedSlots.endTime.getTime());
          }
        } else {
          slots.push({
            advisorId: advisor.id,
            advisorName: advisor.name,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            durationMinutes: visaDef.durationMinutes,
          });
          slotStart = addMinutes(slotStart, visaDef.durationMinutes);
        }
      }
    }
  }

  return slots;
}

export function findEarliestSlot(visaType: VisaType, advisorId?: string) {

  if (advisorId) {
    const slots = getAvailableSlots(visaType, advisorId);
    return slots[0] ?? null;
  }

  const totalAdvisors = store.advisors.length;

  const nextIndex = store.lastAssignedAdvisorIndex % totalAdvisors;
  const nextAdvisor = store.advisors[nextIndex];

  const slots = getAvailableSlots(visaType, nextAdvisor.id);

  if (slots.length > 0) {
    store.lastAssignedAdvisorIndex = (nextIndex + 1) % totalAdvisors;
    return slots[0];
  }

  for (let i = 1; i < totalAdvisors; i++) {
    const fallbackIndex = (nextIndex + i) % totalAdvisors;
    const fallbackAdvisor = store.advisors[fallbackIndex];
    const fallbackSlots = getAvailableSlots(visaType, fallbackAdvisor.id);

    if (fallbackSlots.length > 0) {
      store.lastAssignedAdvisorIndex = (fallbackIndex + 1) % totalAdvisors;
      return fallbackSlots[0];
    }
  }

  return null;
}
