import { useState, type ChangeEvent, type SubmitEvent } from "react";
import Field from "../components/Field";
import inputClass from "../components/InputClassForm";
import { Trash2 } from "lucide-react";
import type {
  SchedulDay,
  SlotAvailabilityValues,
  SlotFormError,
  SlotFormValues,
} from "../types/app";

const SLOT_MINUTES = 60;

interface AddSlotsProps {
  scheduledDays?: SchedulDay[];
  onSave?: (values: SlotAvailabilityValues) => void;
  onRemove?: (id: string) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const INITIAL_VALUES: SlotFormValues = {
  date: "",
  startTime: "09:00",
  endTime: "16:00",
  price: "",
};

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

const generateSlots = (start: string, end: string): string[] => {
  if (!start || !end) return [];
  const slots: string[] = [];
  for (
    let t = toMinutes(start);
    t + SLOT_MINUTES <= toMinutes(end);
    t += SLOT_MINUTES
  ) {
    slots.push(toTime(t));
  }
  return slots;
};

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const AddSlots = ({
  scheduledDays = [
    {
      id: "1",
      date: "2026-10-27",
      startTime: "09:00",
      endTime: "12:00",
      excludedSlots: ["10:00", "14:00"],
      price: 50,
    },
  ],
  onSave,
  onRemove,
  isSubmitting = false,
  serverError = null,
}: AddSlotsProps) => {
  const [values, setValues] = useState<SlotFormValues>(INITIAL_VALUES);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [errors, setErrors] = useState<SlotFormError>({});

  const slots = generateSlots(values.startTime, values.endTime);
  // Ignore excluded times that are outside the current time range
  const validExcluded = excluded.filter((t) => slots.includes(t));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, slots: undefined }));
  };

  const toggleSlot = (time: string) => {
    setExcluded((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
    setErrors((prev) => ({ ...prev, slots: undefined }));
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const found: SlotFormError = {};
    if (!values.date) found.date = "Choose a date.";
    else if (values.date < todayISO())
      found.date = "The date can't be in the past.";
    else if (scheduledDays.some((d) => d.date === values.date))
      found.date = "You already added this date.";

    if (!values.startTime) found.startTime = "Choose a start time.";
    if (!values.endTime) found.endTime = "Choose an end time.";
    else if (values.startTime && slots.length === 0)
      found.endTime = `End time must be after the start, with room for at least one ${SLOT_MINUTES}-minute slot.`;

    if (!values.price || Number(values.price) <= 20)
      found.price = "Enter a price greater than 20.";

    if (slots.length > 0 && validExcluded.length >= slots.length)
      found.slots = "At least one slot must stay bookable.";

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    onSave?.({
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      price: Number(values.price),
      excludedSlots: validExcluded,
    });
  };

  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white">
      <h2 className="text-2xl font-bold md:text-3xl">Add availability</h2>
      <p className="mt-2 text-sm text-slate-600 md:text-base dark:text-slate-300">
        Choose a day and your working hours. Select any slot you want to skip.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50"
      >
        {serverError && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {serverError}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="date" label="Date" error={errors.date}>
            <input
              id="date"
              name="date"
              type="date"
              min={todayISO()}
              value={values.date}
              onChange={handleChange}
              aria-invalid={!!errors.date}
              className={inputClass(!!errors.date)}
            />
          </Field>

          <Field id="startTime" label="From" error={errors.startTime}>
            <input
              id="startTime"
              name="startTime"
              type="time"
              value={values.startTime}
              onChange={handleChange}
              aria-invalid={!!errors.startTime}
              className={inputClass(!!errors.startTime)}
            />
          </Field>

          <Field id="endTime" label="To" error={errors.endTime}>
            <input
              id="endTime"
              name="endTime"
              type="time"
              value={values.endTime}
              onChange={handleChange}
              aria-invalid={!!errors.endTime}
              className={inputClass(!!errors.endTime)}
            />
          </Field>

          <Field id="price" label="Price ($)" error={errors.price}>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={values.price}
              onChange={handleChange}
              placeholder="e.g. 50"
              aria-invalid={!!errors.price}
              className={inputClass(!!errors.price)}
            />
          </Field>
        </div>

        {/* Slots */}
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium">Time slots</h3>
            {slots.length > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {slots.length - validExcluded.length} bookable,{" "}
                {validExcluded.length} excluded
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
            {slots.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose a valid time range to see the slots.
              </p>
            ) : (
              slots.map((time) => {
                const isExcluded = validExcluded.includes(time);
                return (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={isExcluded}
                    onClick={() => toggleSlot(time)}
                    className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isExcluded
                        ? "border-dashed border-slate-300 bg-slate-100 text-slate-400 line-through dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
                        : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400"
                    }`}
                  >
                    {time}
                  </button>
                );
              })
            )}
          </div>

          {errors.slots && (
            <p
              role="alert"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {errors.slots}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Select a slot to exclude it, for example a lunch break. Slots are{" "}
            {SLOT_MINUTES} minutes.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full cursor-pointer rounded-full bg-(--primary-color) px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-48 dark:focus-visible:ring-offset-slate-900"
        >
          {isSubmitting ? "Saving..." : "Save day"}
        </button>
      </form>

      {/* Scheduled days */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-800/50">
        <h3 className="pt-4 text-base font-semibold">Your scheduled days</h3>

        {scheduledDays.length === 0 ? (
          <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
            No days scheduled yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {[...scheduledDays]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day) => (
                <li
                  key={day.id}
                  className="flex flex-wrap items-center gap-3 py-4"
                >
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-medium">
                      {formatDate(day.date)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {day.startTime} to {day.endTime}
                      {day.excludedSlots.length > 0 &&
                        ` - excluded: ${day.excludedSlots.join(", ")}`}
                    </p>
                  </div>
                  <span className="text-sm font-medium">${day.price}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${formatDate(day.date)}`}
                    onClick={() => onRemove?.(day.id)}
                    className="cursor-pointer rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AddSlots;
