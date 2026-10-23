import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { doctors, specialityData } from "../assets/assets_frontend/assets";
import SearchInput from "../components/SearchInput";

const PAGE_SIZE = 12;

const AllDoctors = () => {
  const navigate = useNavigate();
  const { speciality } = useParams<{ speciality?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // searchInput = what the user is typing
  // searchQuery = what we actually search for (set on Enter)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const q = searchQuery.toLowerCase();
  const filtered = doctors.filter(
    (d) =>
      (!speciality || d.speciality === speciality) &&
      (!q ||
        d.name.toLowerCase().includes(q) ||
        d.speciality.toLowerCase().includes(q)),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // The page lives in the URL (?page=2), so there is nothing to reset
  const requestedPage = Number(searchParams.get("page")) || 1;
  const page = Math.min(Math.max(requestedPage, 1), totalPages);

  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setSearchQuery(searchInput.trim());
    setSearchParams({}); 
  };

  const handleSelect = (value: string) => {
    
    navigate(
      speciality === value
        ? "/all-doctors"
        : `/all-doctors/${encodeURIComponent(value)}`,
    );
  };

  const goToPage = (next: number) => {
    setSearchParams({ page: String(next) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="mx-2 mt-8 mb-12 text-slate-900 md:mx-8 lg:mx-15 dark:text-white">
      <p className="mb-6 text-base font-medium text-slate-600 md:text-lg dark:text-slate-300">
        Browse through the doctors speciality
      </p>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Filter: horizontal scroll on mobile, vertical list from md up */}
        <aside className="md:w-60 md:shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            {specialityData.map((item) => {
              const isActive = speciality === item.speciality;
              return (
                <button
                  key={item.speciality}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelect(item.speciality)}
                  className={`cursor-pointer whitespace-nowrap rounded-lg border px-4 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isActive
                      ? "border-transparent bg-(--primary-color) font-semibold text-white"
                      : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400"
                  }`}
                >
                  {item.speciality}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <form onSubmit={handleSubmit}>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by doctor name or speciality"
              className="mb-4"
            />
          </form>

          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} {filtered.length === 1 ? "doctor" : "doctors"}
          </p>

          {visible.length === 0 ? (
            <p className="py-16 text-center text-slate-500 dark:text-slate-400">
              No doctors found.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 xl:gap-6">
              {visible.map((element) => (
                <article
                  onClick={() => navigate(`/doctor/${element._id}`)}
                  key={element._id}
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
          )}

          {/* Pagination arrows */}
          {totalPages > 1 && (
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
        </div>
      </div>
    </section>
  );
};

export default AllDoctors;
