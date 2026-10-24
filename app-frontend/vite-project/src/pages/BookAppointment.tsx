import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets, doctors } from "../assets/assets_frontend/assets";

const TIME_SLOTS: string[] = [
  "8:00 am",
  "8:30 am",
  "9:00 am",
  "9:30 am",
  "10:00 am",
  "10:30 am",
  "11:00 am",
  "11:30 am",
];

const MAX_RELATED = 5;

const getNextDays = (count = 7) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key: d.toDateString(),
      weekday: d
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      date: d.getDate(),
      label: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    };
  });

type Doctor = (typeof doctors)[number];

const DoctorBooking = ({ doctor }: { doctor: Doctor }) => {
  const navigate = useNavigate();
  const days = getNextDays();

  const [selectedDay, setSelectedDay] = useState(days[0].key);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const selectedDayLabel = days.find((d) => d.key === selectedDay)?.label;

  const related = doctors
    .filter((d) => d.speciality === doctor.speciality && d._id !== doctor._id)
    .slice(0, MAX_RELATED);

  const openDoctor = (id: string) => {
    navigate(`/doctor/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 lg:mx-15 dark:text-white">
      {/* Doctor info */}
      <div className="flex flex-col gap-5 md:flex-row md:gap-6">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-full max-w-xs self-center rounded-xl bg-(--primary-color) object-cover md:w-64 md:self-start lg:w-72"
        />

        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:p-8 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-2xl font-semibold sm:text-3xl">{doctor.name}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            <p>
              {doctor.degree} - {doctor.speciality}
            </p>
            <p className="rounded-full border border-slate-300 px-3 py-0.5 text-xs sm:text-sm dark:border-slate-600">
              {doctor.experience}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <p className="font-medium">About</p>
            <img
              src={assets.info_icon}
              alt=""
              className="h-4 w-4 dark:invert"
            />
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Assumenda
            tenetur sit qui neque quibusdam, at aliquam, accusamus aspernatur
            eum delectus, voluptatibus laudantium? Nulla ducimus facere animi
            minima eius voluptatum magnam itaque maiores nisi, eum quos, culpa
            illo. Sed commodi aliquid ipsa harum qui, iusto maxime beatae
            aperiam explicabo quae voluptatum nobis ullam quod fuga aliquam,
            obcaecati amet eos nemo ad velit quaerat fugiat soluta dolores ab.
          </p>

          <h3 className="mt-6 text-base font-medium sm:text-lg">
            Appointment fee:{" "}
            <span className="font-semibold">${doctor.fees}</span>
          </h3>
        </div>
      </div>

      {/* Booking slots */}
      <div className="mt-10 md:ml-68 lg:ml-76">
        <h3 className="text-lg font-semibold">Booking slots</h3>

        {/* Days: scrolls sideways on small screens */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {days.map((day) => {
            const isActive = selectedDay === day.key;
            return (
              <button
                key={day.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedDay(day.key)}
                className={`flex h-20 w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isActive
                    ? "border-transparent bg-(--primary-color) font-semibold text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400"
                }`}
              >
                <span>{day.weekday}</span>
                <span>{day.date}</span>
              </button>
            );
          })}
        </div>

        {/* Times: wrap on small screens */}
        <div className="mt-4 flex flex-wrap gap-3">
          {TIME_SLOTS.map((time) => {
            const isActive = selectedTime === time;
            return (
              <button
                key={time}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedTime(time)}
                className={`cursor-pointer rounded-full border px-5 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isActive
                    ? "border-transparent bg-(--primary-color) font-semibold text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400"
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className="mt-5 min-h-6 text-sm text-slate-600 dark:text-slate-300"
        >
          {selectedTime
            ? `Selected: ${selectedDayLabel} at ${selectedTime}`
            : "Select a time to continue"}
        </p>

        <button
          type="button"
          disabled={!selectedTime}
          // TODO: call the booking API with doctor._id, selectedDay and selectedTime
          className="mt-3 w-full cursor-pointer rounded-full bg-(--primary-color) px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-64 dark:focus-visible:ring-offset-slate-900"
        >
          Book an appointment
        </button>
      </div>

      {/* Related doctors */}
      {related.length > 0 && (
        <div className="mt-16 md:mt-24">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Related Doctors
          </h2>
          <p className="mx-auto mt-3 mb-8 max-w-xl text-center text-sm font-medium text-slate-600 md:text-base dark:text-slate-300">
            Simply browse through our extensive list of trusted doctors.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
            {related.map((element) => (
              <article
                key={element._id}
                onClick={() => openDoctor(element._id)}
                className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-transform duration-300 hover:-translate-y-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-slate-700 dark:bg-slate-800"
              >
                <img
                  src={element.image}
                  alt={element.name}
                  className="aspect-square w-full bg-sky-50 object-cover dark:bg-slate-700"
                />
                <div className="p-3 sm:p-4">
                  <p
                    className={`flex items-center gap-2 text-xs font-medium sm:text-sm ${
                      element.available
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${
                        element.available ? "bg-green-500" : "bg-slate-400"
                      }`}
                    />
                    {element.available ? "Available" : "Not available"}
                  </p>
                  <h3 className="mt-1.5 truncate text-sm font-semibold sm:text-base lg:text-lg">
                    {element.name}
                  </h3>
                  <p className="truncate text-xs text-slate-600 sm:text-sm dark:text-slate-300">
                    {element.speciality}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const BookAppointment = () => {
  const { docId } = useParams<{ docId: string }>();
  const filterDoc = doctors.find((d) => docId === d._id);

  if (!filterDoc) {
    return (
      <p className="py-24 text-center text-slate-600 dark:text-slate-300">
        Doctor not found.
      </p>
    );
  }

  // key resets the selected day/time when you open another doctor
  return <DoctorBooking key={filterDoc._id} doctor={filterDoc} />;
};

export default BookAppointment;
