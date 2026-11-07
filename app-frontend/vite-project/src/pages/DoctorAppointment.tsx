import { useState, type SubmitEvent } from "react";
import { useSearchParams } from "react-router-dom";

import type {
  Appointment,
  AppointmentStatus,
  DoctorAppointmentsProps,
  SearchInputProps,
  StatusFilter,
} from "../types/app";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import AppointmentCard from "../components/AppointmentCard";

const APPOINTMENTS_PER_PAGE = 10;

const DEFAULT_STATUS: StatusFilter = "pending";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) => (
  <div className={`relative w-full ${className}`}>
    <Search
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
    />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
    />
  </div>
);

const DoctorAppointments = ({
  appointments = [],
  totalPages = 1,
  total,
  isLoading = false,
  error = null,
  actingId = null,
  onStatusChange,
  onAccept,
  onComplete,
  onReject,
}: DoctorAppointmentsProps) => {
  // The status is plain state. Page and search live in the URL: ?page=2&search=sara
  const [status, setStatus] = useState<StatusFilter>(DEFAULT_STATUS);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const searchQuery = searchParams.get("search") ?? "";

  const requestedPage = Number(searchParams.get("page")) || 1;
  const page = Math.min(Math.max(requestedPage, 1), Math.max(totalPages, 1));

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleStatus = (value: StatusFilter) => {
    setStatus(value);
    setConfirmId(null);
    updateParams({ page: null }); // a new tab starts from page 1
    onStatusChange?.(value);
  };

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfirmId(null);
    updateParams({ search: searchInput.trim(), page: null });
  };

  const goToPage = (next: number) => {
    setConfirmId(null);
    updateParams({ page: String(next) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmReject = (id: string) => {
    onReject?.(id);
    setConfirmId(null);
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <p className="py-12 text-center text-slate-600 dark:text-slate-300">
          Loading appointments...
        </p>
      );
    }

    if (error) {
      return (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      );
    }

    if (appointments.length === 0) {
      return (
        <p className="py-12 text-center text-slate-500 dark:text-slate-400">
          {searchQuery
            ? "No appointments match your search."
            : `No ${status === "all" ? "" : `${status} `}appointments.`}
        </p>
      );
    }

    return (
      <ul className="flex flex-col gap-3" aria-live="polite">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            isActing={actingId === appointment._id}
            isConfirming={confirmId === appointment._id}
            onAccept={() => onAccept?.(appointment._id)}
            onComplete={() => onComplete?.(appointment._id)}
            onAskReject={() => setConfirmId(appointment._id)}
            onConfirmReject={() => handleConfirmReject(appointment._id)}
            onCancelReject={() => setConfirmId(null)}
          />
        ))}
      </ul>
    );
  };

  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold md:text-3xl">Appointments</h2>
        {total !== undefined && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total} {total === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 max-w-md">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by patient name"
        />
      </form>

      {/* Status tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => {
          const isActive = status === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleStatus(item.value)}
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

      <div className="mt-6">{renderList()}</div>

      {/* Pagination arrows */}
      {totalPages > 1 && !isLoading && !error && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-center gap-4"
        >
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="cursor-pointer rounded-full border border-slate-300 p-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            aria-label="Next page"
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
            className="cursor-pointer rounded-full border border-slate-300 p-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </nav>
      )}
    </section>
  );
};

const NAMES: [string, string][] = [
  ["Sara", "Ahmed"],
  ["Omar", "Nasser"],
  ["Lina", "Haddad"],
  ["Adam", "Berg"],
  ["Noor", "Aziz"],
  ["Leo", "Fischer"],
  ["Mia", "Novak"],
];

const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "rejected",
  "pending",
  "confirmed",
];

const pad = (n: number) => String(n).padStart(2, "0");

const fakeAppointments: Appointment[] = Array.from({ length: 23 }, (_, i) => {
  const [first, last] = NAMES[i % NAMES.length];
  const day = 6 + (i % 10);
  const hour = 9 + (i % 6);

  return {
    _id: `a${i + 1}`,
    patientID: {
      _id: `p${i + 1}`,
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}@example.com`,
      avatar: `https://ui-avatars.com/api/?name=${first}+${last}&background=random&color=fff&size=128`,
    },
    slotID: {
      _id: `s${i + 1}`,
      date: `2026-11-${pad(day)}`,
      startTime: `${pad(hour)}:00`,
      endTime: `${pad(hour + 1)}:00`,
    },
    status: STATUSES[i % STATUSES.length],
    price: 50,
    paymentStatus: i % 3 === 0 ? "paid" : "pending",
    notes: i % 4 === 0 ? "Get well soon." : null,
  };
});

const AppointmentsPage = () => {
  const [all, setAll] = useState<Appointment[]>(fakeAppointments);
  const [status, setStatus] = useState<StatusFilter>(DEFAULT_STATUS);
  const [params] = useSearchParams();

  const search = (params.get("search") ?? "").toLowerCase();
  const requestedPage = Number(params.get("page")) || 1;

  const filtered = all.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      (!search ||
        `${a.patientID.first_name} ${a.patientID.last_name}`
          .toLowerCase()
          .includes(search)),
  );

  // Pagination: APPOINTMENTS_PER_PAGE appointments per page
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE),
  );
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const visible = filtered.slice(
    (page - 1) * APPOINTMENTS_PER_PAGE,
    page * APPOINTMENTS_PER_PAGE,
  );

  const changeStatus = (id: string, newStatus: AppointmentStatus) =>
    setAll((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a)),
    );

  return (
    <DoctorAppointments
      appointments={visible}
      totalPages={totalPages}
      total={filtered.length}
      onStatusChange={setStatus}
      onAccept={(id) => changeStatus(id, "confirmed")}
      onComplete={(id) => changeStatus(id, "completed")}
      onReject={(id) => changeStatus(id, "rejected")}
    />
  );
};

export default AppointmentsPage;
