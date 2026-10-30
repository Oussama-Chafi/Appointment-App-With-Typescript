import type { ReactNode } from "react";

export interface initial_value {
  speciality: string;
  consultationFee: string;
  phone: string;
  address: string;
}

export interface FieldProps {
  id: string;
  label: string;
  className?: string;
  error?: string;
  children: ReactNode;
}

export type FormErrors = Partial<Record<keyof initial_value, string>>;

export interface ApplyDoctorProps {
  onSubmit?: (values: initial_value) => void;
  submitting?: boolean;
  submitted?: boolean;
  serverError?: string | null;
}

export interface SlotAvailabilityValues {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  excludedSlots: string[];
}
export interface SchedulDay extends SlotAvailabilityValues {
  id: string;
}

export interface SlotFormValues {
  date: string;
  startTime: string;
  endTime: string;
  price: string;
}

export type SlotFormError = Partial<
  Record<keyof SlotFormValues | "slots", string>
>;

export interface Slot {
  _id: string;
  date: string; // "2026-10-30"
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  price: number;
  isBooked: boolean;
}

export interface MySlotsProps {
  slots?: Slot[];
  isLoading?: boolean;
  error?: string | null;
}

export type Filter = "all" | "available" | "booked";

export interface DaySlots {
  date: string;
  slots: Slot[];
  bookedCount: number;
}
