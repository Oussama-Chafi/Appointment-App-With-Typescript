import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { DaySlots, Filter, MySlotsProps, Slot } from "../types/app";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
];

// Sort by date then start time, and group the flat list into days
const groupSlotsByDate = (slots: Slot[]): DaySlots[] => {
  const sorted = [...slots].sort((a, b) =>
    a.date === b.date
      ? a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date),
  );
  const byDate = new Map<string, Slot[]>();

  for (const slot of sorted) {
    const list = byDate.get(slot.date);
    if (list) list.push(slot);
    else byDate.set(slot.date, [slot]);
  }

  return [...byDate.entries()].map(([date, daySlot]) => ({
    date,
    slots: daySlot,
    bookedCount: daySlot.filter((s) => s.isBooked).length,
  }));
};

// "T12:00:00" keeps the day from shifting in some timezones
const formatDate = (date: string, style: "short" | "long"): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: style,
    month: "short",
    day: "numeric",
  });

const priceLabel = (slots: Slot[]): string => {
  const prices = slots.map((s) => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min} per slot` : `$${min} to $${max} per slot`;
};

const MySlots = ({
  slots = [
    {
      _id: "1",
      date: "2026-10-30", 
      startTime: "09:00", 
      endTime: "10:00", 
      price: 50,
      isBooked: true,
    },
    {
      _id: "2",
      date: "2026-10-30", 
      startTime: "10:00",
      endTime: "11:00",  
      price: 50,
      isBooked: false,
    },
    {
      _id: "3",
      date: "2026-10-30",
      startTime: "11:00",
      endTime: "12:00", 
      price: 50,
      isBooked: true,
    },
    {
      _id: "4",
      date: "2026-10-30", 
      startTime: "14:00", 
      endTime: "15:00", 
      price: 50,
      isBooked: false,
    },
    {
      _id: "5",
      date: "2026-10-30", 
      startTime: "09:00", 
      endTime: "10:00", 
      price: 50,
      isBooked: false,
    },
    {
      _id: "6",
      date: "2026-10-30", 
      startTime: "10:00", 
      endTime: "11:00",
      price: 50,
      isBooked: false,
    },
    {
      _id: "7",
      date: "2026-10-30", 
      startTime: "11:00",
      endTime: "12:00",
      price: 50,
      isBooked: false,
    },
    {
      _id: "8",
      date: "2026-10-30", 
      startTime: "14:00", 
      endTime: "15:00", 
      price: 50,
      isBooked: false,
    },
    {
      _id: "9",
      date: "2026-11-01", 
      startTime: "11:00",
      endTime: "12:00", 
      price: 50,
      isBooked: false,
    },
    {
      _id: "10",
      date: "2026-11-01", 
      startTime: "14:00", 
      endTime: "15:00",
      price: 50,
      isBooked: false,
    },
  ],
  isLoading = false,
  error = null,
}: MySlotsProps) => {
  const location = useLocation();
  const navigationState = location.state?.date;
  const [selectedDate, setSelectedDate] = useState<string | null>(
    navigationState,
  );
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <p className="py-24 text-center text-slate-600 dark:text-slate-300">
        Loading your slots...
      </p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="mx-auto my-12 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      >
        {error}
      </p>
    );
  }

  const days = groupSlotsByDate(slots);

  if (days.length === 0) {
    return (
      <p className="py-24 text-center text-slate-600 dark:text-slate-300">
        You have no slots yet.
      </p>
    );
  }

  // If nothing is selected (or the selected day disappeared), show the first day
  const currentDay = days.find((d) => d.date === selectedDate) ?? days[0];

  const visibleSlots = currentDay.slots.filter((s) =>
    filter === "all" ? true : filter === "booked" ? s.isBooked : !s.isBooked,
  );

  const availableCount = currentDay.slots.length - currentDay.bookedCount;

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    setFilter("all");
  };

  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white h-screen">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold md:text-3xl">My slots</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {slots.length} {slots.length === 1 ? "slot" : "slots"} on{" "}
          {days.length} {days.length === 1 ? "day" : "days"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row ">
        {/* Days list */}
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white lg:w-72 lg:shrink-0 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/50">
          {days.map((day) => {
            const isActive = day.date === currentDay.date;
            return (
              <li key={day.date}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectDay(day.date)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-700/60"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatDate(day.date, "short")}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {day.slots[0].startTime} to{" "}
                      {day.slots[day.slots.length - 1].endTime}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {day.bookedCount}/{day.slots.length} booked
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Selected day */}
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">
                {formatDate(currentDay.date, "long")}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {currentDay.slots[0].startTime} to{" "}
                {currentDay.slots[currentDay.slots.length - 1].endTime} -{" "}
                {priceLabel(currentDay.slots)}
              </p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {availableCount} available, {currentDay.bookedCount} booked
            </p>
          </div>

          {/* Filter */}
          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const isActive = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setFilter(item.value)}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isActive
                      ? "border-transparent bg-(--primary-color) font-semibold text-white"
                      : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Slots */}
          {visibleSlots.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
              No {filter === "booked" ? "booked" : "available"} slots on this
              day.
            </p>
          ) : (
            <ul
              className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
              aria-live="polite"
            >
              {visibleSlots.map((slot) => (
                <li
                  onClick={() => navigate(`/doctors/my-slots/${slot._id}`)}
                  key={slot._id}
                  className={`rounded-lg border px-3 py-2.5 ${
                    slot.isBooked
                      ? "border-dashed border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-700/40"
                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                  }`}
                >
                  <p className="text-sm font-medium sm:text-base">
                    {slot.startTime} - {slot.endTime}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    {slot.isBooked ? "Booked" : "Available"} - ${slot.price}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            Slots you excluded when adding the day are not shown.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MySlots;
