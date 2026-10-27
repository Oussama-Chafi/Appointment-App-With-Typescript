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
