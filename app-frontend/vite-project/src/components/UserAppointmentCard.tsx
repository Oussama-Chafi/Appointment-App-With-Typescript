import {
  Calendar,
  Check,
  CheckCheck,
  CircleCheck,
  Clock,
  CreditCard,
  MapPin,
  X,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "../utils/formatDate";
import type {
  AppointmentStatus,
  UserAppointmentsCardProps,
} from "../types/app";

const STATUS_BADGE: Record<
  AppointmentStatus,
  { label: string; Icon: LucideIcon }
> = {
  pending: { label: "Waiting for the doctor", Icon: Clock },
  confirmed: { label: "Confirmed", Icon: Check },
  completed: { label: "Completed", Icon: CheckCheck },
  rejected: { label: "Rejected by the doctor", Icon: X },
  cancelled: { label: "Cancelled by you", Icon: X },
};

const buttonBase =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50";

const badgeClass =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-2.5 py-0.5 text-xs dark:border-slate-600";

const UserAppointmentCard = ({
  appointment,
  isActing,
  isConfirming,
  onPay,
  onAskCancel,
  onConfirmCancel,
  onKeep,
}: UserAppointmentsCardProps) => {
  const { doctorID, slotID, status } = appointment;
  const { Icon, label } = STATUS_BADGE[status];
  const doctorName = `${doctorID.userID.first_name} ${doctorID.userID.last_name}`;

  // Only pending and confirmed appointments can still be paid or cancelled
  const isOpen = status === "pending" || status === "confirmed";
  const showPaymentBadge = status !== "rejected" && status !== "cancelled";

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <img
        src={doctorID.userID.avatar}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />

      <div className="min-w-56 flex-1">
        <p className="flex items-center gap-1.5 font-semibold">
          <Calendar aria-hidden="true" className="h-4 w-4 shrink-0" />
          {formatDate(slotID.date)} - {slotID.startTime} to {slotID.endTime}
        </p>
        <p className="mt-1">Dr. {doctorName}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {doctorID.specialty} - ${appointment.price}
        </p>
        <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {doctorID.address}
        </p>
        {appointment.notes && (
          <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-400">
            &ldquo;{appointment.notes}&rdquo;
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={badgeClass}>
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </span>
          {showPaymentBadge && (
            <span className={badgeClass}>
              {appointment.payment ? (
                <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <CreditCard aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {appointment.payment ? "Paid" : "Unpaid"}
            </span>
          )}
        </div>
      </div>

      {isOpen &&
        (isConfirming ? (
          <div className="flex flex-col flex-wrap items-center gap-2 mx-auto">
            <span className="text-sm">Cancel this appointment?</span>
            <div className="flex gap-3 items-center ">
              <button
                type="button"
                disabled={isActing}
                onClick={onConfirmCancel}
                className={`${buttonBase} border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40`}
              >
                Yes, cancel
              </button>
              <button
                type="button"
                onClick={onKeep}
                className={`${buttonBase} border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700`}
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!appointment.payment && (
              <button
                type="button"
                disabled={isActing}
                onClick={onPay}
                className={`${buttonBase} border-transparent bg-(--primary-color) text-white hover:opacity-90`}
              >
                Pay ${appointment.price}
              </button>
            )}
            <button
              type="button"
              disabled={isActing}
              onClick={onAskCancel}
              className={`${buttonBase} border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700`}
            >
              Cancel appointment
            </button>
          </div>
        ))}
    </li>
  );
};

export default UserAppointmentCard;
