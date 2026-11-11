import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BadgeDollarSign,
  Clock,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  SquareArrowRightExit,
  Star,
  Stethoscope,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  Doctor,
  DoctorProfileProps,
  DoctorStatus,
  UpdateDoctorPayload,
} from "../types/app";
import EditForm from "../components/ProfileEditForm";
import { useNavigate } from "react-router-dom";

const STATUS_PILL: Record<DoctorStatus, { label: string; Icon: LucideIcon }> = {
  approved: { label: "Approved", Icon: BadgeCheck },
  pending: { label: "Pending approval", Icon: Clock },
  rejected: { label: "Rejected", Icon: XCircle },
};

const fakeDoctor: Doctor = {
  _id: "62",
  userID: {
    _id: "60",
    first_name: "Richard",
    last_name: "James",
    email: "RichardJames@appointment.com",
    phone: null,
    gender: null,
  },
  phone: "1234567890",
  specialty: "General physician",
  address: "addresstest",
  consultationFee: 50,
  bio: null,
  isAcceptingAppointments: true,
  status: "approved",
  averageRating: 3.3,
  numOfReviews: 10,
};

const pill =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-sm dark:border-slate-600";

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  value?: string | null;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <div className="flex items-start gap-3">
    <div
      aria-hidden="true"
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 "
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {value ? (
        <p className="wrap-anywhere font-medium ">{value}</p>
      ) : (
        <p className="text-slate-400 dark:text-slate-500">Not added</p>
      )}
    </div>
  </div>
);

interface SectionProps {
  title: string;
  className?: string;
  children: ReactNode;
}

const Section = ({ title, className = "", children }: SectionProps) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50 ${className}`}
  >
    <h3 className="mb-4 text-base font-semibold">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const DoctorProfile = ({
  doctor = fakeDoctor,
  isLoading = false,
  error = null,
  onSave,
}: DoctorProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <p className="py-24 text-center text-slate-600 dark:text-slate-300">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <p
          role="alert"
          className="mx-auto my-12 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen">
        <p className="py-24 text-center text-slate-600 dark:text-slate-300">
          Profile not found.
        </p>
      </div>
    );
  }

  const { userID } = doctor;
  const fullName = `${userID.first_name} ${userID.last_name}`;
  const { Icon: StatusIcon, label: statusLabel } =
    STATUS_PILL[doctor.status as DoctorStatus];

  // Close the form only when the save worked. If onSave throws, the form shows the error.
  const handleSave = async (payload: UpdateDoctorPayload) => {
    await onSave?.(payload);
    setIsEditing(false);
  };

  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white ">
      <h2 className="text-2xl font-bold md:text-3xl">My profile</h2>

      {/* Header card */}
      <div className="mt-6 flex flex-col items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 text-center sm:flex-row sm:p-6 sm:text-left dark:border-slate-700 dark:bg-slate-800/50">
        {userID.avatar ? (
          <img
            src={userID.avatar}
            alt={fullName}
            className="h-28 w-28 shrink-0 rounded-full bg-(--primary-color) object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:h-32 sm:w-32 dark:bg-slate-700 dark:text-slate-300"
          >
            <User className="h-12 w-12" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold sm:text-2xl">Dr. {fullName}</h3>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className={pill}>
              <Stethoscope aria-hidden="true" className="h-4 w-4" />
              {doctor.specialty}
            </span>
            <span className={pill}>
              <StatusIcon aria-hidden="true" className="h-4 w-4" />
              {statusLabel}
            </span>
            <span className={pill}>
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  doctor.isAcceptingAppointments
                    ? "bg-green-500"
                    : "bg-slate-400"
                }`}
              />
              {doctor.isAcceptingAppointments
                ? "Accepting appointments"
                : "Not accepting appointments"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-slate-600 sm:justify-start dark:text-slate-300">
            <p>
              Consultation fee:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                ${doctor.consultationFee}
              </span>
            </p>
            <p className="inline-flex items-center gap-1.5">
              <Star aria-hidden="true" className="h-4 w-4" />
              {doctor.numOfReviews === 0
                ? "No reviews yet"
                : `${doctor.averageRating.toFixed(1)} (${doctor.numOfReviews} ${
                    doctor.numOfReviews === 1 ? "review" : "reviews"
                  })`}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Edit profile
          </button>
        )}
      </div>

      {isEditing ? (
        <EditForm
          doctor={doctor}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Section title="Contact">
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={userID.email}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Personal phone"
              value={userID.phone}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Practice phone"
              value={doctor.phone}
            />
          </Section>

          <Section title="Practice">
            <InfoRow
              icon={<Stethoscope className="h-4 w-4" />}
              label="Speciality"
              value={doctor.specialty}
            />
            <InfoRow
              icon={<BadgeDollarSign className="h-4 w-4" />}
              label="Consultation fee"
              value={`$${doctor.consultationFee}`}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={doctor.address}
            />
          </Section>

          <Section title="About" className="md:col-span-2">
            {doctor.bio ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 md:text-base dark:text-slate-300">
                {doctor.bio}
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500">Not added</p>
            )}
          </Section>
        </div>
      )}
      <div className="mt-6 flex flex-col items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 text-center sm:flex-row md:justify-center xl:justify-between sm:p-6 sm:text-left dark:border-slate-700 dark:bg-slate-800/50 lg:max-w-[40%] xl:max-w-[27%]">
        <button
          onClick={() => navigate("/profile/change-password")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-600 dark:hover:bg-slate-700 "
        >
          <KeyRound className="w-5 h-5" />
          Change Password
        </button>
        <button
          onClick={() => navigate("/profile/logout-from-all-devices")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <SquareArrowRightExit className="h-5 w-5" />
          Log out from all devices
        </button>
      </div>
    </section>
  );
};
export default DoctorProfile;
