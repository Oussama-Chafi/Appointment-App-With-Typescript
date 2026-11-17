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

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled";

interface BasicAppointment {
  success: boolean;
  message?: string;
  results: number;
  total: number;
  page: number;
  totalPages: number;
  slotID: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  status: AppointmentStatus;
  price: number;
  payment: boolean;
  paymentIntentId?: string | null;
  paymentStatus: "pending" | "paid" | "faild" | "refunded";
  notes?: string | null;
}
interface Person {
  _id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  gender: "male" | "female" | null;
  avatar: string;
}
export interface DoctorAppointment extends BasicAppointment {
  _id: string;
  patientID: Person;
  doctorID: string;
}

export type StatusFilter = AppointmentStatus | "all";

export interface AppointmentCardProps {
  appointment: DoctorAppointment;
  isActing: boolean;
  isConfirming: boolean;
  onAccept: () => void;
  onComplete: () => void;
  onAskReject: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
}

export interface DoctorAppointmentsProps {
  appointments?: DoctorAppointment[];
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

export type DoctorStatus = "pending" | "approved" | "rejected";

export interface Doctor {
  _id: string;
  userID: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    gender?: string | null;
    avatar?: string | null;
  };
  phone: string; // the doctor's practice phone
  specialty: string;
  address: string;
  consultationFee: number;
  bio?: string | null;
  isAcceptingAppointments: boolean;
  status: DoctorStatus;
  averageRating: number;
  numOfReviews: number;
}

export interface UpdateDoctorPayload {
  specialty?: string;
  address?: string;
  consultationFee?: number;
  isAcceptingAppointments?: boolean;
  bio?: string;
  email?: string;
  phone?: string; // the user's personal phone
  doctorPhone?: string; // the doctor's practice phone
}

export interface DoctorProfileProps {
  doctor?: Doctor | null;
  isLoading?: boolean;
  error?: string | null;
  // Return a promise (for example await dispatch(...).unwrap()) so the form
  // can close on success and show the error if the request fails
  onSave?: (payload: UpdateDoctorPayload) => Promise<void> | void;
}

export interface UpdateProfileFormValues {
  specialty: string;
  address: string;
  consultationFee: string;
  isAcceptingAppointments: boolean;
  bio: string;
  email: string;
  phone: string;
  doctorPhone: string;
}

export type UpdateProfileFormErrors = Partial<
  Record<keyof UpdateProfileFormValues, string>
>;

export type TabFilter = "upcoming" | "completed" | "cancelled" | "all";

export interface UserAppointments extends BasicAppointment {
  _id: string;
  doctorID: {
    _id: string;
    userID: Person;
    phone: string;
    specialty: string;
    address: string;
    consultationFee: number;
  };
  patientID?: Person;
}

export interface UserAppointmentsCardProps {
  appointment: UserAppointments;
  isActing: boolean;
  isConfirming: boolean;
  onPay: () => void;
  onAskCancel: () => void;
  onConfirmCancel: () => void;
  onKeep: () => void;
}

export interface MyAppointmentsProps {
  appointments?: UserAppointments[];
  totalPages?: number;
  isLoading?: boolean;
  error?: string | null;
  actingId?: string | null; // id of the appointment whose request is running
  onTabChange?: (tab: TabFilter) => void;
  onPay?: (id: string) => void;
  onCancel?: (id: string) => void;
}
