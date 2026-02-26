export type VisaType = 'A' | 'B';

export const VisaTypeDef = {
  A: { label: 'Skilled Worker',     durationMinutes: 30, breakAfterMinutes: 5  },
  B: { label: 'Family / Dependent', durationMinutes: 60, breakAfterMinutes: 10 },
} as const;

export interface AvailabilityWindow {
  start: string;
  end: string;
}

export interface AdvisorSeed {
  id: string;
  name: string;
  availability: AvailabilityWindow[];
}

export interface AvailableSlot {
  advisorId: string;
  advisorName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'expired';

export interface Booking {
  id: string;
  advisorId: string;
  advisorName: string;
  candidateName: string;
  visaType: VisaType;
  visaLabel: string;
  durationMinutes: number;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  heldAt?: Date;
  heldUntil?: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
}

export interface ListBookingsFilters {
  status?: string;
  advisorId?: string;
  visaType?: string;
}

export interface WaitlistEntry {
  id: string;
  candidateName: string;
  visaType: VisaType;
  addedAt: Date;
  advisorPreference?: string;
}

