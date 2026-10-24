import { useNavigate } from "react-router-dom";
import { doctors } from "../assets/assets_frontend/assets";

const MAX_DOCTORS = 10;

const TopDoctors = () => {
  const navigate = useNavigate();
  return (
    <section
      id="doctors"
      className="mx-auto my-12 max-w-7xl px-4 text-slate-900 md:my-20 dark:text-white dark:bg-black"
    >
      <h2 className="text-center text-2xl font-bold md:text-3xl lg:text-4xl">
        Top Doctors To Book
      </h2>

      <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-sm font-medium text-slate-600 md:mt-5 md:text-base lg:mb-14 dark:text-slate-300">
        Simply browse through our extensive list of trusted doctors.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
        {doctors.slice(0, MAX_DOCTORS).map((element) => (
          <article
            onClick={() => {
              navigate(`/doctor/${element._id}`);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
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
      <button
        onClick={() => {
          navigate("/all-doctors");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="bg-(--more-doctors-bg-button) text-gray-800 rounded-full my-10 md:my-20 px-10 py-3 block mx-auto cursor-pointer hover:opacity-95"
      >
        more
      </button>
    </section>
  );
};

export default TopDoctors;
