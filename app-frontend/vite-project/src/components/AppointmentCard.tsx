import { Check, CheckCheck, Clock, X, type LucideIcon } from "lucide-react";
import type { AppointmentCardProps, AppointmentStatus } from "../types/app";

const formatDate = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const buttonBase =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_PILL: Record<
  AppointmentStatus,
  { label: string; Icon: LucideIcon }
> = {
  pending: { label: "Pending", Icon: Clock },
  confirmed: { label: "Confirmed", Icon: Check },
  completed: { label: "Completed", Icon: CheckCheck },
  rejected: { label: "Rejected", Icon: X },
};

const AppointmentCard = ({
  appointment,
  isActing,
  isConfirming,
  onAccept,
  onComplete,
  onAskReject,
  onConfirmReject,
  onCancelReject,
}: AppointmentCardProps) => {
  const { patientID, slotID, status } = appointment;
  const { Icon, label } = STATUS_PILL[status];
  const fullName = `${patientID.first_name} ${patientID.last_name}`;

  const isOpen = status === "pending" || status === "confirmed";
  const primary =
    status === "pending"
      ? { label: "Accept", Icon: Check, onClick: onAccept }
      : { label: "Complete", Icon: CheckCheck, onClick: onComplete };

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/50">
      {patientID.avatar ? (
        <img
          src={patientID.avatar}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold dark:bg-slate-700"
        >
          {getInitials(fullName)}
        </div>
      )}

      <div className="min-w-44 flex-1">
        <p className="font-medium">{fullName}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {formatDate(slotID.date)} - {slotID.startTime} to {slotID.endTime} - $
          {appointment.price}
        </p>
        {appointment.notes && (
          <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-400">
            &ldquo;{appointment.notes}&rdquo;
          </p>
        )}
        <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
          Payment: {appointment.paymentStatus}
        </p>
        <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
          status: {appointment.status}
        </p>
      </div>

      {!isOpen ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-600">
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          {label}
        </span>
      ) : isConfirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Reject this appointment?</span>
          <button
            type="button"
            disabled={isActing}
            onClick={onConfirmReject}
            className={`${buttonBase} border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40`}
          >
            Yes, reject
          </button>
          <button
            type="button"
            onClick={onCancelReject}
            className={`${buttonBase} border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700`}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isActing}
            onClick={primary.onClick}
            className={`${buttonBase} border-transparent bg-(--primary-color) text-white hover:opacity-90`}
          >
            <primary.Icon aria-hidden="true" className="h-4 w-4" />
            {primary.label}
          </button>
          <button
            type="button"
            disabled={isActing}
            onClick={onAskReject}
            className={`${buttonBase} border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700`}
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </li>
  );
};

export default AppointmentCard;
