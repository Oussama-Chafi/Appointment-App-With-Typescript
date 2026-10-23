import { useNavigate } from "react-router-dom";
import { specialityData } from "../assets/assets_frontend/assets";

const TopSpecialties = () => {
  const navigate = useNavigate();
  return (
    <section
      id="speciality"
      className="mx-auto my-12 max-w-5xl px-4 text-slate-900 md:my-20 lg:my-28 dark:text-white dark:bg-black"
    >
      <h2 className="text-center text-2xl font-bold md:text-3xl lg:text-4xl">
        Find By Speciality
      </h2>

      <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-sm font-medium text-slate-600 md:mt-5 md:text-base lg:mb-14 dark:text-slate-300">
        Simply browse through our extensive list of trusted doctors, schedule
        your appointment hassle-free.
      </p>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-10">
        {specialityData.map((element) => (
          <div
            onClick={() => navigate(`/all-doctors/${element.speciality}`)}
            key={element.speciality}
            className="flex w-24 cursor-pointer flex-col items-center gap-2 text-center transition-transform duration-300 hover:-translate-y-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-28 md:w-32"
          >
            <img
              src={element.image}
              alt={element.speciality}
              className="h-16 w-16 object-contain sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28"
            />
            <p className="text-xs font-semibold sm:text-sm md:text-base">
              {element.speciality}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopSpecialties;
