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

export interface Appointment {
  _id: string;
  patientID: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string | null;
  };
  slotID: {
    _id: string;
    date: string; // "2026-11-06"
    startTime: string; // "11:00"
    endTime: string; // "12:00"
  };
  status: AppointmentStatus;
  price: number;
  paymentStatus: string;
  notes?: string | null;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "rejected";
export type StatusFilter = AppointmentStatus | "all";

export interface AppointmentCardProps {
  appointment: Appointment;
  isActing: boolean;
  isConfirming: boolean;
  onAccept: () => void;
  onComplete: () => void;
  onAskReject: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
}

export interface DoctorAppointmentsProps {
  appointments?: Appointment[];
  totalPages?: number;
  total?: number;
  isLoading?: boolean;
  error?: string | null;
  actingId?: string | null; // id of the appointment whose request is running
  onStatusChange?: (status: StatusFilter) => void;
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  onReject?: (id: string) => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
