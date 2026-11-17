import { useState, type SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SearchInput from "../components/SearchInput";
import type {
  AppointmentStatus,
  MyAppointmentsProps,
  TabFilter,
  UserAppointments,
} from "../types/app";
import UserAppointmentCard from "../components/UserAppointmentCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const APPOINTMENTS_PER_PAGE = 10;

// The tab selected when the page opens
const DEFAULT_TAB: TabFilter = "upcoming";

// Which appointment statuses belong to each tab (null = no filter).
// Use it to filter the fake data now, and to build the "status" query for the API later.
const TAB_STATUSES: Record<TabFilter, AppointmentStatus[] | null> = {
  upcoming: ["pending", "confirmed"],
  completed: ["completed"],
  cancelled: ["rejected", "cancelled"],
  all: null,
};

const TABS: { value: TabFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const MyAppointments = ({
  appointments = [],
  totalPages = 1,
  isLoading = false,
  error = null,
  actingId = null,
  onTabChange,
  onPay,
  onCancel,
}: MyAppointmentsProps) => {
  // The tab is plain state. The page lives in the URL: ?page=2
  const [tab, setTab] = useState<TabFilter>(DEFAULT_TAB);
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

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

  const handleTab = (value: TabFilter) => {
    setTab(value);
    setConfirmId(null);
    setSearchParams({}); // a new tab starts from page 1
    onTabChange?.(value);
  };

  const goToPage = (next: number) => {
    setConfirmId(null);
    setSearchParams({ page: String(next) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmCancel = (id: string) => {
    onCancel?.(id);
    setConfirmId(null);
  };

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfirmId(null);
    updateParams({ search: search.trim(), page: null });
  };
  const renderList = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen">
          <p className="py-12 text-center text-slate-600 dark:text-slate-300">
            Loading your appointments...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen">
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="py-12 text-center min-h-screen">
          <p className="text-slate-500 dark:text-slate-400">
            No appointments here yet.
          </p>
          <Link
            to="/all-doctors"
            className="mt-4 inline-block rounded-lg bg-(--primary-color) px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Find a doctor
          </Link>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3 min-h-screen" aria-live="polite">
        {appointments.map((appointment) => (
          <UserAppointmentCard
            key={appointment._id}
            appointment={appointment}
            isActing={actingId === appointment._id}
            isConfirming={confirmId === appointment._id}
            onPay={() => onPay?.(appointment._id)}
            onAskCancel={() => setConfirmId(appointment._id)}
            onConfirmCancel={() => handleConfirmCancel(appointment._id)}
            onKeep={() => setConfirmId(null)}
          />
        ))}
      </ul>
    );
  };

  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white">
      <h2 className="text-2xl font-bold md:text-3xl">My appointments</h2>
      <form onSubmit={handleSearch} className="max-w-md mt-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by doctor name or date"
        />
      </form>
      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const isActive = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleTab(item.value)}
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

/* ------------------------------------------------------------------ */
/* 5. Fake data (delete this block when you connect the API)           */
/* ------------------------------------------------------------------ */

const DOCTORS: [string, string, string, string, string][] = [
  [
    "Richard",
    "James",
    "General physician",
    "57th Cross, Richmond Circle, London",
    "1324567890",
  ],
  ["Amira", "Khalil", "Cardiologist", "12 Baker Street, London", "3234142346"],
  ["Jonas", "Weber", "Dermatologist", "8 Queens Road, London", "5465879425"],
  ["Lina", "Haddad", "Pediatrician", "3 Mill Lane, London", "8765436120"],
  ["Omar", "Nasser", "Neurologist", "41 High Street, London", "4578651201"],
  ["Sofia", "Rossi", "Gynecologist", "9 Park Avenue, London", "7878451202"],
];

const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
  "pending",
  "confirmed",
];

const pad = (n: number) => String(n).padStart(2, "0");

const fakeAppointments: UserAppointments[] = Array.from(
  { length: 10 },
  (_, i) => {
    const [first, last, specialty, address, phone] =
      DOCTORS[i % DOCTORS.length];
    const status = STATUSES[i % STATUSES.length];
    const day = 3 + (i % 25);
    const hour = 9 + (i % 7);

    return {
      success: true,
      total: 1,
      totalPages: 1,
      results: 1,
      page: 1,
      _id: `a${i + 1}`,
      doctorID: {
        _id: `d${(i % DOCTORS.length) + 1}`,
        userID: {
          first_name: first,
          last_name: last,
          avatar: `https://ui-avatars.com/api/?name=${first}+${last}&background=random&color=fff&size=128`,
          email: `${first}@gmail.com`,
          gender: `${i % 2 === 0 ? "male" : "female"}`,
          phone: null,
        },
        specialty,
        address,
        consultationFee: 50 + (i % 4) * 10,
        phone: phone,
      },
      slotID: {
        _id: `s${i + 1}`,
        date: `2026-11-${pad(day)}`,
        startTime: `${pad(hour)}:00`,
        endTime: `${pad(hour + 1)}:00`,
      },
      status,
      price: 50 + (i % 4) * 10,
      paymentStatus:
        status === "cancelled" || status === "rejected"
          ? "refunded"
          : status === "pending"
            ? "pending"
            : status === "completed" || status === "confirmed"
              ? "paid"
              : "pending",
      payment: status === "completed" ? true : i % 3 === 0,
      notes: i % 5 === 0 ? "Get well soon." : null,
    };
  },
);

/* ------------------------------------------------------------------ */
/* 6. The page: filtering and pagination on the fake data              */
/* ------------------------------------------------------------------ */

const MyAppointmentsPage = () => {
  const [all, setAll] = useState<UserAppointments[]>(fakeAppointments);
  const [tab, setTab] = useState<TabFilter>(DEFAULT_TAB);
  const [params] = useSearchParams();

  const requestedPage = Number(params.get("page")) || 1;

  // Filter by the statuses of the selected tab, then sort
  const statuses = TAB_STATUSES[tab];
  const filtered = all
    .filter((a) => !statuses || statuses.includes(a.status))
    .sort((a, b) => {
      const aKey = a.slotID.date + a.slotID.startTime;
      const bKey = b.slotID.date + b.slotID.startTime;
      // upcoming: the nearest first, other tabs: the latest first
      return tab === "upcoming"
        ? aKey.localeCompare(bKey)
        : bKey.localeCompare(aKey);
    });

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

  // Pay and cancel on the fake data (to test the buttons)
  const handlePay = (id: string) =>
    setAll((prev) =>
      prev.map((a) => (a._id === id ? { ...a, payment: true } : a)),
    );

  const handleCancel = (id: string) =>
    setAll((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a)),
    );

  return (
    <MyAppointments
      appointments={visible}
      totalPages={totalPages}
      onTabChange={setTab}
      onPay={handlePay}
      onCancel={handleCancel}
    />
  );
};

export default MyAppointmentsPage;
