import { useState, type ChangeEvent, type FormEvent } from "react";
import { specialityData } from "../assets/assets_frontend/assets";
import Field from "../components/Field";
import type { ApplyDoctorProps, FormErrors, initial_value } from "../types/app";
import inputClass from "../components/InputClassForm";

const initialValues = {
  speciality: "",
  consultationFee: "",
  phone: "",
  address: "",
};

const validate = (values: initial_value): FormErrors => {
  const error: FormErrors = {};
  if (!values.speciality) error.speciality = "Speciality is required";
  if (!values.consultationFee || Number(values.consultationFee) <= 20)
    error.consultationFee = "Consultation fee must be higher than 20";
  if (
    !values.phone ||
    typeof Number(values.phone) !== "number" ||
    values.phone.length !== 10
  )
    error.phone = "Phone number is required";
  if (!values.address) error.address = "Address is required";
  return error;
};

const ApplyDoctor = ({
  submitting = false,
  onSubmit,
  serverError = null,
  submitted = false,
}: ApplyDoctorProps) => {
  const [values, setValues] = useState<initial_value>(initialValues);
  const [error, setError] = useState<FormErrors>({});
  const handleChange = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const cleaned =
      name === "phone" ? value.replace(/[^0-9+\s()-]/g, "") : value;
    setValues((p) => ({ ...p, [name]: cleaned }));
    setError((p) => ({ ...p, [name]: undefined }));
  };
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setError(found);
      return;
    }
    onSubmit?.(values);
    setValues({ address: "", consultationFee: "", phone: "", speciality: "" });
  };
  if (submitted) {
    return (
      <section className="mx-2 my-12 text-slate-900 md:mx-8 lg:mx-15 dark:text-white h-screen">
        <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-semibold">Application submitted</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Your application is under review. You will be able to use your
            doctor account once an admin approves it.
          </p>
        </div>
      </section>
    );
  }
  return (
    <section className="mx-2 my-12 text-slate-900 md:mx-8 lg:mx0-15 dark:text-white">
      <h2 className="text-center text-2xl md:text-3xl font-bold">
        Doctors Application
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-600 md:text-base dark:text-slate-300">
        Fill in the detials below, and an admin will review your request
      </p>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto mt-8 max-w-2xl rounded-xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-700 dark:bg-slate-800/50"
      >
        {serverError && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {serverError}
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-5">
          <Field id="Speciality" label="Speciality" error={error.speciality}>
            <select
              name="speciality"
              id="Speciality"
              value={values.speciality}
              onChange={handleChange}
              className={inputClass(!!error.speciality)}
            >
              <option value="" disabled>
                Select speciality
              </option>
              {specialityData.map((element) => (
                <option value={element.speciality} key={element.speciality}>
                  {element.speciality}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="ConsultationFee"
            label="ConsultationFee"
            error={error.consultationFee}
          >
            <input
              type="number"
              placeholder="Add your consultationFee"
              inputMode="decimal"
              min={20}
              id="ConsultationFee"
              name="consultationFee"
              value={values.consultationFee}
              onChange={handleChange}
              className={inputClass(!!error.consultationFee)}
            />
          </Field>
          <Field
            id="Phone"
            label="Phone"
            error={error.phone}
            className="md:col-span-2"
          >
            <input
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={handleChange}
              className={inputClass(!!error.phone)}
              placeholder="Add your phone number"
              name="phone"
              id="Phone"
            />
          </Field>
          <Field
            id="Address"
            label="Address"
            error={error.address}
            className="md:col-span-2"
          >
            <textarea
              name="address"
              id="Address"
              rows={3}
              value={values.address}
              onChange={handleChange}
              placeholder="Clenic or work address"
              className={inputClass(!!error.address)}
            ></textarea>
          </Field>
        </div>
        <button className="mt-8 w-full cursor-pointer rounded-full bg-(--primary-color) px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56 dark:focus-visible:ring-offset-slate-900">
          {submitting ? "Sending..." : "Send application"}
        </button>
      </form>
    </section>
  );
};

export default ApplyDoctor;
