import { useState, type ChangeEvent, type SubmitEvent } from "react";
import type {
  Doctor,
  UpdateDoctorPayload,
  UpdateProfileFormErrors,
  UpdateProfileFormValues,
} from "../types/app";
import { specialityData } from "../assets/assets_frontend/assets";
import Field from "./Field";
import inputClass from "./InputClassForm";

interface EditFormProps {
  doctor: Doctor;
  onSave: (payload: UpdateDoctorPayload) => Promise<void> | void;
  onCancel: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toFormValues = (doctor: Doctor): UpdateProfileFormValues => ({
  specialty: doctor.specialty,
  address: doctor.address,
  consultationFee: String(doctor.consultationFee),
  isAcceptingAppointments: doctor.isAcceptingAppointments,
  bio: doctor.bio ?? "",
  email: doctor.userID.email,
  phone: doctor.userID.phone ?? "",
  doctorPhone: doctor.phone,
});

const validate = (values: UpdateProfileFormValues): UpdateProfileFormErrors => {
  const errors: UpdateProfileFormErrors = {};
  if (!values.specialty) errors.specialty = "Please choose a speciality.";
  if (!values.consultationFee || Number(values.consultationFee) <= 0)
    errors.consultationFee = "Enter a consultation fee greater than 0.";
  if (!values.address.trim()) errors.address = "Address is required.";
  if (!values.doctorPhone.trim())
    errors.doctorPhone = "Practice phone is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(values.email.trim()))
    errors.email = "Enter a valid email.";
  return errors;
};

// Only the fields that really changed are sent to the API
const buildPayload = (
  initial: UpdateProfileFormValues,
  values: UpdateProfileFormValues,
): UpdateDoctorPayload => {
  const payload: UpdateDoctorPayload = {};
  if (values.specialty !== initial.specialty)
    payload.specialty = values.specialty;
  if (values.address.trim() !== initial.address.trim())
    payload.address = values.address.trim();
  if (Number(values.consultationFee) !== Number(initial.consultationFee))
    payload.consultationFee = Number(values.consultationFee);
  if (values.isAcceptingAppointments !== initial.isAcceptingAppointments)
    payload.isAcceptingAppointments = values.isAcceptingAppointments;
  if (values.bio.trim() !== initial.bio.trim()) payload.bio = values.bio.trim();
  if (values.email.trim() !== initial.email.trim())
    payload.email = values.email.trim();
  if (values.phone.trim() && values.phone.trim() !== initial.phone.trim())
    payload.phone = values.phone.trim();
  if (values.doctorPhone.trim() !== initial.doctorPhone.trim())
    payload.doctorPhone = values.doctorPhone.trim();
  return payload;
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
};

const EditForm = ({ doctor, onSave, onCancel }: EditFormProps) => {
  const initial = toFormValues(doctor);
  const [values, setValues] = useState<UpdateProfileFormValues>(initial);
  const [errors, setErrors] = useState<UpdateProfileFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keep the doctor's current speciality in the list even if it isn't there
  const allSpecialities = specialityData.map((s) => s.speciality);
  const specialityOptions = allSpecialities.includes(initial.specialty)
    ? allSpecialities
    : [initial.specialty, ...allSpecialities];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  };

  const toggleAccepting = () => {
    setValues((prev) => ({
      ...prev,
      isAcceptingAppointments: !prev.isAcceptingAppointments,
    }));
    setServerError(null);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const payload = buildPayload(initial, values);
    if (Object.keys(payload).length === 0) {
      setServerError("You haven't changed anything.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setIsSaving(false);
    }
  };

  const isOn = values.isAcceptingAppointments;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <h3 className="mb-5 text-base font-semibold">Edit profile</h3>

      {serverError && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {serverError}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field id="specialty" label="Speciality" error={errors.specialty}>
          <select
            id="specialty"
            name="specialty"
            value={values.specialty}
            onChange={handleChange}
            aria-invalid={!!errors.specialty}
            className={inputClass(!!errors.specialty)}
          >
            {specialityOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="consultationFee"
          label="Consultation fee ($)"
          error={errors.consultationFee}
        >
          <input
            id="consultationFee"
            name="consultationFee"
            type="number"
            min="1"
            step="1"
            inputMode="decimal"
            value={values.consultationFee}
            onChange={handleChange}
            aria-invalid={!!errors.consultationFee}
            className={inputClass(!!errors.consultationFee)}
          />
        </Field>

        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
            className={inputClass(!!errors.email)}
          />
        </Field>

        <Field id="phone" label="Personal phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            placeholder="Your personal number"
            className={inputClass(!!errors.phone)}
          />
        </Field>

        <Field
          id="doctorPhone"
          label="Practice phone"
          error={errors.doctorPhone}
          className="md:col-span-2"
        >
          <input
            id="doctorPhone"
            name="doctorPhone"
            type="tel"
            value={values.doctorPhone}
            onChange={handleChange}
            aria-invalid={!!errors.doctorPhone}
            className={inputClass(!!errors.doctorPhone)}
          />
        </Field>

        <Field
          id="address"
          label="Address"
          error={errors.address}
          className="md:col-span-2"
        >
          <textarea
            id="address"
            name="address"
            rows={2}
            value={values.address}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            className={inputClass(!!errors.address)}
          />
        </Field>

        <Field
          id="bio"
          label="About you"
          error={errors.bio}
          className="md:col-span-2"
        >
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={values.bio}
            onChange={handleChange}
            placeholder="Tell patients about your experience"
            className={inputClass(!!errors.bio)}
          />
        </Field>

        {/* Accepting appointments switch */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4 md:col-span-2 dark:border-slate-700">
          <div>
            <p id="accepting-label" className="text-sm font-medium">
              Accepting appointments
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Patients can book new appointments only while this is on.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            aria-labelledby="accepting-label"
            onClick={toggleAccepting}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              isOn ? "bg-(--primary-color)" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                isOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="cursor-pointer rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer rounded-lg bg-(--primary-color) px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default EditForm;
